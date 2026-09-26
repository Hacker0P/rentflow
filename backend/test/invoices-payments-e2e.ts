import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

async function runInvoicesPaymentsTests() {
  console.log('🧪 Starting Invoices & Payments Module Integration Tests...\n');

  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const server = await app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 4004;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const prisma = app.get(PrismaService);
  const testEmail = 'ananya.sen@example.com';

  async function cleanUser(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.payment.deleteMany({
        where: { invoice: { lease: { unit: { property: { ownerId: user.id } } } } },
      });
      await prisma.invoiceItem.deleteMany({
        where: { invoice: { lease: { unit: { property: { ownerId: user.id } } } } },
      });
      await prisma.invoice.deleteMany({
        where: { lease: { unit: { property: { ownerId: user.id } } } },
      });
      await prisma.lease.deleteMany({
        where: { unit: { property: { ownerId: user.id } } },
      });
      await prisma.unit.deleteMany({
        where: { property: { ownerId: user.id } },
      });
      await prisma.property.deleteMany({
        where: { ownerId: user.id },
      });
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  }

  // Clean setup
  await cleanUser(testEmail);

  try {
    // ----------------------------------------------------
    // SETUP: Register Landlord, Property, Unit, and Lease
    // ----------------------------------------------------
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Sen',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const token = (await regRes.json()).data.accessToken;

    const propRes = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Lotus Residency',
        address: '108 Salt Lake Sector 5, Kolkata 700091',
      }),
    });
    const propertyId = (await propRes.json()).data.id;

    const unitRes = await fetch(`${baseUrl}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitNumber: 'Flat 101',
        floor: 1,
      }),
    });
    const unitId = (await unitRes.json()).data.id;

    const leaseRes = await fetch(`${baseUrl}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitId,
        tenant: {
          name: 'Debashis Roy',
          phone: '+91-9830012345',
          email: 'debashis.roy@example.com',
        },
        monthlyRent: 15000,
        maintenanceAmount: 2000,
        rentDueDay: 5,
        startDate: '2026-08-01',
      }),
    });
    const leaseData = (await leaseRes.json()).data;
    console.log(`✅ Setup: Created Lease for Unit Flat 101 (Rent: ₹15,000, Maint: ₹2,000, Total Expected: ₹17,000)`);

    // ----------------------------------------------------
    // TEST 1: Monthly Invoice Batch Generation
    // ----------------------------------------------------
    console.log('\nTest 1: POST /api/v1/invoices/generate (Automated batch billing for September 2026)');
    const genRes = await fetch(`${baseUrl}/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        billingMonth: '2026-09',
      }),
    });

    const genData = (await genRes.json()).data;
    if (genRes.status !== 201 || genData.generatedCount !== 1) {
      throw new Error(`Test 1 Failed: Expected 1 invoice generated, got ${JSON.stringify(genData)}`);
    }

    const invoice = genData.invoices[0];
    if (Number(invoice.totalAmount) !== 17000 || invoice.items.length !== 2) {
      throw new Error(`Test 1 Failed: Expected ₹17,000 total with 2 items, got ${invoice.totalAmount}`);
    }
    console.log(`  ✅ Invoice generated [ID: ${invoice.id}]. Total: ₹${invoice.totalAmount} (Rent ₹15,000 + Maint ₹2,000). Status: ${invoice.status}`);

    // ----------------------------------------------------
    // TEST 2: Idempotency Verification
    // ----------------------------------------------------
    console.log('\nTest 2: POST /api/v1/invoices/generate (Idempotency: duplicate run for same month)');
    const dupGenRes = await fetch(`${baseUrl}/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        billingMonth: '2026-09',
      }),
    });

    const dupGenData = (await dupGenRes.json()).data;
    if (dupGenData.generatedCount !== 0 || dupGenData.skippedCount !== 1) {
      throw new Error(`Test 2 Failed: Idempotency failed: ${JSON.stringify(dupGenData)}`);
    }
    console.log(`  ✅ Idempotency confirmed: Generated=0, Skipped=1 (no duplicate invoices issued)`);

    // ----------------------------------------------------
    // TEST 3: Record Partial Payment
    // ----------------------------------------------------
    console.log('\nTest 3: POST /api/v1/invoices/:id/payments (Record partial payment: ₹10,000 of ₹17,000)');
    const pay1Res = await fetch(`${baseUrl}/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 10000,
        paymentMethod: 'UPI',
        transactionReference: 'UPI/20260904/LOTUS101',
        notes: 'Partial payment received via Google Pay',
      }),
    });

    const pay1Data = (await pay1Res.json()).data;
    if (pay1Res.status !== 201) {
      throw new Error(`Test 3 Failed: ${JSON.stringify(pay1Data)}`);
    }
    const summary1 = pay1Data.invoiceSummary;
    if (summary1.paidAmount !== 10000 || summary1.remainingBalance !== 7000) {
      throw new Error(`Test 3 Failed: Balance mismatch: ${JSON.stringify(summary1)}`);
    }
    console.log(`  ✅ Partial payment recorded: ₹${pay1Data.payment.amount} via UPI.`);
    console.log(`  📊 Invoice Balance: Paid=₹${summary1.paidAmount}, Remaining=₹${summary1.remainingBalance}, Status=${summary1.status}`);

    // ----------------------------------------------------
    // TEST 4: Overpayment Rejection
    // ----------------------------------------------------
    console.log('\nTest 4: POST /api/v1/invoices/:id/payments (Overpayment rejection: Attempt to pay ₹10,000 when ₹7,000 is due)');
    const overpayRes = await fetch(`${baseUrl}/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 10000, // Exceeds remaining 7000!
        paymentMethod: 'CASH',
      }),
    });

    const overpayJson = await overpayRes.json();
    if (overpayRes.status !== 400) {
      throw new Error(`Test 4 Failed: Expected 400 Bad Request, got ${overpayRes.status}`);
    }
    console.log(`  ✅ Overpayment rejected with 400 Bad Request: "${overpayJson.message}"`);

    // ----------------------------------------------------
    // TEST 5: Complete Settlement Payment
    // ----------------------------------------------------
    console.log('\nTest 5: POST /api/v1/invoices/:id/payments (Settle remaining ₹7,000 balance)');
    const pay2Res = await fetch(`${baseUrl}/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 7000,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'NEFT/20260905/LOTUS101',
        notes: 'Final balance settled via NEFT transfer',
      }),
    });

    const pay2Data = (await pay2Res.json()).data;
    if (pay2Res.status !== 201) {
      throw new Error(`Test 5 Failed: ${JSON.stringify(pay2Data)}`);
    }
    const summary2 = pay2Data.invoiceSummary;
    if (summary2.paidAmount !== 17000 || summary2.remainingBalance !== 0 || summary2.status !== 'PAID') {
      throw new Error(`Test 5 Failed: Expected PAID status with 0 remaining: ${JSON.stringify(summary2)}`);
    }
    console.log(`  ✅ Final payment recorded: ₹${pay2Data.payment.amount} via BANK_TRANSFER.`);
    console.log(`  🎉 Invoice Fully Settled: Paid=₹${summary2.paidAmount}, Remaining=₹${summary2.remainingBalance}, Status=${summary2.status}`);

    // ----------------------------------------------------
    // TEST 6: Verify Invoice Detail Endpoint
    // ----------------------------------------------------
    console.log('\nTest 6: GET /api/v1/invoices/:id (Query full invoice details with payments and items)');
    const invDetailRes = await fetch(`${baseUrl}/invoices/${invoice.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const invDetail = (await invDetailRes.json()).data;
    if (invDetail.payments.length !== 2 || invDetail.items.length !== 2) {
      throw new Error(`Test 6 Failed: Incomplete detail returned: ${JSON.stringify(invDetail)}`);
    }
    console.log(`  ✅ Invoice verified: ${invDetail.items.length} line items, ${invDetail.payments.length} payment records, Status=${invDetail.status}`);

    // ----------------------------------------------------
    // TEST 7: Landlord Global Payments Ledger
    // ----------------------------------------------------
    console.log('\nTest 7: GET /api/v1/payments (Global payment accounting ledger)');
    const ledgerRes = await fetch(`${baseUrl}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ledger = (await ledgerRes.json()).data;
    if (ledger.length !== 2) {
      throw new Error(`Test 7 Failed: Expected 2 ledger entries, got ${ledger.length}`);
    }
    console.log(`  ✅ Ledger verified: Found ${ledger.length} payments recorded across landlord properties.`);

    console.log('\n🎉 ALL 7 INVOICING & PAYMENT TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    await cleanUser(testEmail);
    await app.close();
  }
}

runInvoicesPaymentsTests().catch((err) => {
  console.error('❌ Invoices/Payments Test suite failed:', err);
  process.exit(1);
});
