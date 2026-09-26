import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

async function runTenantsLeasesTests() {
  console.log('🧪 Starting Tenants & Leases Module Integration Tests...\n');

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
  const port = typeof address === 'object' && address ? address.port : 4003;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const prisma = app.get(PrismaService);
  const testEmail = 'vikram.malhotra@example.com';

  async function cleanUser(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
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

  // Clean previous test user
  await cleanUser(testEmail);

  try {
    // ----------------------------------------------------
    // SETUP: Register Landlord, Property, and Unit
    // ----------------------------------------------------
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikram Malhotra',
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
        name: 'Royal Palms',
        address: '77 Koramangala 4th Block, Bengaluru 560034',
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
        unitNumber: 'Flat 401',
        floor: 4,
        status: 'VACANT',
      }),
    });
    const unitId = (await unitRes.json()).data.id;
    console.log(`✅ Setup: Created Property "${propertyId}" & Unit "${unitId}" (initial status: VACANT)`);

    // ----------------------------------------------------
    // TEST 1: Create Lease with Inline Tenant
    // ----------------------------------------------------
    console.log('\nTest 1: POST /api/v1/leases (Create lease with inline tenant creation)');
    const createLeaseRes = await fetch(`${baseUrl}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitId,
        tenant: {
          name: 'Kavita Rao',
          phone: '+91-9988776655',
          email: 'kavita.rao@example.com',
        },
        monthlyRent: 25000,
        maintenanceAmount: 3500,
        securityDeposit: 75000,
        rentDueDay: 5,
        startDate: '2026-09-01',
      }),
    });

    const leaseData = (await createLeaseRes.json()).data;
    if (createLeaseRes.status !== 201 || !leaseData?.id) {
      throw new Error(`Test 1 Failed: ${JSON.stringify(leaseData)}`);
    }
    const leaseId = leaseData.id;
    console.log(`  ✅ Lease created [ID: ${leaseId}]. Rent: ₹${leaseData.monthlyRent}, Maintenance: ₹${leaseData.maintenanceAmount}, Tenant: ${leaseData.tenant.name}`);

    // ----------------------------------------------------
    // TEST 2: Verify Automatic Occupancy Synchronization
    // ----------------------------------------------------
    console.log('\nTest 2: GET /api/v1/units/:id (Verify unit status auto-synced to OCCUPIED)');
    const checkUnitRes = await fetch(`${baseUrl}/units/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const unitAfterLease = (await checkUnitRes.json()).data;
    if (unitAfterLease.status !== 'OCCUPIED') {
      throw new Error(`Test 2 Failed: Expected unit to be OCCUPIED, got ${unitAfterLease.status}`);
    }
    console.log(`  ✅ Unit status automatically synchronized: ${unitAfterLease.status}`);

    // ----------------------------------------------------
    // TEST 3: Single Active Lease Invariant Enforcement
    // ----------------------------------------------------
    console.log('\nTest 3: POST /api/v1/leases (Conflict rejection: Unit already has an active lease)');
    const conflictLeaseRes = await fetch(`${baseUrl}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitId,
        tenant: {
          name: 'Another Tenant',
          phone: '+91-9123456789',
        },
        monthlyRent: 26000,
        rentDueDay: 1,
        startDate: '2026-09-15',
      }),
    });

    const conflictJson = await conflictLeaseRes.json();
    if (conflictLeaseRes.status !== 409) {
      throw new Error(`Test 3 Failed: Expected 409 Conflict, got ${conflictLeaseRes.status}`);
    }
    console.log(`  ✅ Active lease conflict properly blocked with 409 Conflict: "${conflictJson.message}"`);

    // ----------------------------------------------------
    // TEST 4: Rent Due Day Normalization (1 to 28)
    // ----------------------------------------------------
    console.log('\nTest 4: POST /api/v1/leases (Validation: rentDueDay cannot exceed 28)');
    const invalidDueDayRes = await fetch(`${baseUrl}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitId,
        tenantId: leaseData.tenantId,
        monthlyRent: 20000,
        rentDueDay: 31, // Invalid! Max is 28 to avoid Feb/short month issues
        startDate: '2026-10-01',
      }),
    });

    if (invalidDueDayRes.status !== 400) {
      throw new Error(`Test 4 Failed: Expected 400 Bad Request for due day > 28, got ${invalidDueDayRes.status}`);
    }
    console.log('  ✅ Validation confirmed: rentDueDay > 28 correctly rejected with 400 Bad Request');

    // ----------------------------------------------------
    // TEST 5: Tenant Directory Query
    // ----------------------------------------------------
    console.log('\nTest 5: GET /api/v1/tenants (Query landlord tenant directory)');
    const listTenantsRes = await fetch(`${baseUrl}/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenantsList = (await listTenantsRes.json()).data;
    const kavita = tenantsList.find((t: any) => t.phone === '+91-9988776655');
    if (!kavita || kavita.leases.length !== 1) {
      throw new Error(`Test 5 Failed: Could not find tenant with active lease: ${JSON.stringify(tenantsList)}`);
    }
    console.log(`  ✅ Tenant directory returned "${kavita.name}" with active lease on Unit ${kavita.leases[0].unit.unitNumber}`);

    // ----------------------------------------------------
    // TEST 6: Safe Lease Termination & Vacancy Auto-Reversion
    // ----------------------------------------------------
    console.log('\nTest 6: PATCH /api/v1/leases/:id/terminate (Terminate lease and auto-revert unit to VACANT)');
    const termRes = await fetch(`${baseUrl}/leases/${leaseId}/terminate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const termData = (await termRes.json()).data;
    if (termData.status !== 'ENDED') {
      throw new Error(`Test 6 Failed: Expected lease status ENDED, got ${termData.status}`);
    }
    console.log(`  ✅ Lease terminated successfully. Status: ${termData.status}, End Date: ${termData.endDate}`);

    const unitAfterTermRes = await fetch(`${baseUrl}/units/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const unitAfterTerm = (await unitAfterTermRes.json()).data;
    if (unitAfterTerm.status !== 'VACANT') {
      throw new Error(`Test 6 Failed: Expected unit to revert to VACANT, got ${unitAfterTerm.status}`);
    }
    console.log(`  ✅ Unit status automatically reverted to: ${unitAfterTerm.status}`);

    // ----------------------------------------------------
    // TEST 7: Create New Lease on now-vacant Unit
    // ----------------------------------------------------
    console.log('\nTest 7: POST /api/v1/leases (Re-leasing the vacated unit to a new tenant)');
    const newLeaseRes = await fetch(`${baseUrl}/leases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitId,
        tenant: {
          name: 'Suresh Raina',
          phone: '+91-9888877777',
        },
        monthlyRent: 27000,
        rentDueDay: 1,
        startDate: '2026-10-01',
      }),
    });
    const newLeaseData = (await newLeaseRes.json()).data;
    if (newLeaseRes.status !== 201) {
      throw new Error(`Test 7 Failed to re-lease unit: ${JSON.stringify(newLeaseData)}`);
    }
    console.log(`  ✅ New lease successfully activated for "${newLeaseData.tenant.name}". Unit is OCCUPIED again.`);

    console.log('\n🎉 ALL 7 TENANT & LEASE MANAGEMENT TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    await cleanUser(testEmail);
    await app.close();
  }
}

runTenantsLeasesTests().catch((err) => {
  console.error('❌ Tenants/Leases Test suite failed:', err);
  process.exit(1);
});
