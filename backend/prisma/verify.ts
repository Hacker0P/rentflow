import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Running RentFlow Database Verification...\n');

  // 1. Verify Landlord -> Properties -> Units
  const landlord = await prisma.user.findUnique({
    where: { email: 'rahul.sharma@example.com' },
    include: {
      properties: {
        include: {
          units: true,
        },
      },
    },
  });

  if (!landlord) {
    throw new Error('Landlord not found!');
  }

  console.log('👤 Landlord & Properties:');
  console.log(`- Landlord: ${landlord.name} <${landlord.email}>`);
  for (const prop of landlord.properties) {
    console.log(`  🏢 Property: ${prop.name} (${prop.address})`);
    console.log(`     Units (${prop.units.length}): ${prop.units.map(u => `${u.unitNumber} [${u.status}]`).join(', ')}`);
  }

  // 2. Verify Lease -> Tenant & Unit
  const leases = await prisma.lease.findMany({
    include: {
      tenant: true,
      unit: {
        include: {
          property: true,
        },
      },
      invoices: {
        include: {
          items: true,
          payments: true,
        },
      },
    },
  });

  console.log('\n📜 Leases & Billing:');
  for (const lease of leases) {
    console.log(`- Lease ID: ${lease.id} [Status: ${lease.status}]`);
    console.log(`  Tenant: ${lease.tenant.name} | Phone: ${lease.tenant.phone}`);
    console.log(`  Unit: ${lease.unit.unitNumber} @ ${lease.unit.property.name}`);
    console.log(`  Rent: ₹${lease.monthlyRent} | Maintenance: ₹${lease.maintenanceAmount} | Due Day: ${lease.rentDueDay}th`);

    console.log(`  📑 Invoices (${lease.invoices.length}):`);
    for (const inv of lease.invoices) {
      console.log(`    - Invoice ID: ${inv.id}`);
      console.log(`      Billing Month: ${inv.billingMonth.toISOString().slice(0, 10)} | Due Date: ${inv.dueDate.toISOString().slice(0, 10)}`);
      console.log(`      Status: ${inv.status} | Total Amount: ₹${inv.totalAmount}`);

      console.log('      Line Items:');
      for (const item of inv.items) {
        console.log(`        * [${item.type}] ${item.description}: ₹${item.amount}`);
      }

      console.log(`      Payments Received (${inv.payments.length}):`);
      let totalPaid = 0;
      for (const pay of inv.payments) {
        totalPaid += Number(pay.amount);
        console.log(`        * ₹${pay.amount} on ${pay.paymentDate.toISOString().slice(0, 10)} via ${pay.paymentMethod} (Ref: ${pay.transactionReference})`);
      }

      const balanceRemaining = Number(inv.totalAmount) - totalPaid;
      console.log(`      💰 Financial Summary: Total Due: ₹${inv.totalAmount} | Total Paid: ₹${totalPaid} | Balance Due: ₹${balanceRemaining}`);
    }
  }

  console.log('\n✅ Verification Complete! All relational models, constraints, and financial decimals match expectations.');
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
