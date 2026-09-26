import {
  PrismaClient,
  UnitStatus,
  LeaseStatus,
  InvoiceStatus,
  InvoiceItemType,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RentFlow database seed...');

  // Clean existing data in reverse dependency order
  await prisma.maintenanceRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Landlord (User)
  const landlord = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      passwordHash,
      role: UserRole.LANDLORD,
      phone: '+91-9811223344',
      upiId: 'rahul.sharma@okhdfcbank',
      panNumber: 'ABCPS1234F',
      bankName: 'HDFC Bank Ltd',
      bankAccountNumber: '50100492817291',
      bankIfsc: 'HDFC0000123',
    },
  });
  console.log(`✅ Created Landlord: ${landlord.name} (${landlord.email}) [ID: ${landlord.id}]`);

  // 2. Create Tenant (User)
  const tenantUser = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit.kumar@example.com',
      passwordHash,
      role: UserRole.TENANT,
      phone: '+91-9876543210',
    },
  });
  console.log(`✅ Created Tenant User: ${tenantUser.name} (${tenantUser.email}) [ID: ${tenantUser.id}]`);

  // 3. Create Property
  const property = await prisma.property.create({
    data: {
      ownerId: landlord.id,
      name: 'Green Residency',
      address: '123 Palm Avenue, Indiranagar, Bengaluru, Karnataka 560038',
    },
  });
  console.log(`✅ Created Property: ${property.name} [ID: ${property.id}]`);

  // 4. Create Units: 101 (Occupied), 102 (Vacant), 103 (Vacant)
  const unit101 = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '101',
      floor: 1,
      status: UnitStatus.OCCUPIED,
    },
  });

  const unit102 = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '102',
      floor: 1,
      status: UnitStatus.VACANT,
    },
  });

  const unit103 = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '103',
      floor: 1,
      status: UnitStatus.VACANT,
    },
  });
  console.log(`✅ Created Units: 101 (${unit101.status}), 102 (${unit102.status}), 103 (${unit103.status})`);

  // 5. Create Tenant Profile linked to tenantUser
  const tenant = await prisma.tenant.create({
    data: {
      userId: tenantUser.id,
      name: 'Amit Kumar',
      email: 'amit.kumar@example.com',
      phone: '+91-9876543210',
    },
  });
  console.log(`✅ Created Tenant Profile: ${tenant.name} (${tenant.phone}) [ID: ${tenant.id}]`);

  // 6. Create Active Lease for Unit 101
  const lease = await prisma.lease.create({
    data: {
      tenantId: tenant.id,
      unitId: unit101.id,
      monthlyRent: 15000.0,
      maintenanceAmount: 2000.0,
      securityDeposit: 50000.0,
      rentDueDay: 5,
      startDate: new Date('2026-08-01'),
      status: LeaseStatus.ACTIVE,
    },
  });
  console.log(`✅ Created Lease for Unit 101: Rent ₹15,000, Maintenance ₹2,000, Due Day 5th [ID: ${lease.id}]`);

  // 7. Create August 2026 Invoice (Fully Paid Control control for receipts)
  const augustInvoice = await prisma.invoice.create({
    data: {
      leaseId: lease.id,
      billingMonth: new Date('2026-08-01'),
      dueDate: new Date('2026-08-05'),
      status: InvoiceStatus.PAID,
      totalAmount: 17000.0,
      items: {
        create: [
          {
            type: InvoiceItemType.RENT,
            description: 'Monthly Apartment Rent - August 2026',
            amount: 15000.0,
          },
          {
            type: InvoiceItemType.MAINTENANCE,
            description: 'Society Maintenance Charges - August 2026',
            amount: 2000.0,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: augustInvoice.id,
      amount: 17000.0,
      paymentDate: new Date('2026-08-04'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.CONFIRMED,
      transactionReference: 'NEFT/20260804/448109923',
      notes: 'August 2026 rent paid in full via NEFT.',
    },
  });
  console.log(`✅ Created August 2026 Settled Invoice & Receipt [ID: ${augustInvoice.id}]`);

  // 8. Create September 2026 Invoice (Partially Paid / Overdue)
  const septInvoice = await prisma.invoice.create({
    data: {
      leaseId: lease.id,
      billingMonth: new Date('2026-09-01'),
      dueDate: new Date('2026-09-05'),
      status: InvoiceStatus.PARTIALLY_PAID,
      totalAmount: 17000.0,
      items: {
        create: [
          {
            type: InvoiceItemType.RENT,
            description: 'Monthly Apartment Rent - September 2026',
            amount: 15000.0,
          },
          {
            type: InvoiceItemType.MAINTENANCE,
            description: 'Society Maintenance Charges - September 2026',
            amount: 2000.0,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: septInvoice.id,
      amount: 10000.0,
      paymentDate: new Date('2026-09-04'),
      paymentMethod: PaymentMethod.UPI,
      status: PaymentStatus.CONFIRMED,
      transactionReference: 'UPI/20260904/987123456',
      notes: 'Partial payment received for September rent via Google Pay. Balance due: ₹7,000.',
    },
  });
  console.log(`✅ Created September 2026 Invoice: Total ₹17,000 with ₹10,000 paid [ID: ${septInvoice.id}]`);

  // 9. Create Sample Maintenance Request
  const maintenance = await prisma.maintenanceRequest.create({
    data: {
      unitId: unit101.id,
      tenantId: tenant.id,
      title: 'Bathroom Sink Tap Leaking',
      category: MaintenanceCategory.PLUMBING,
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.IN_PROGRESS,
      description: 'The hot water tap valve in the master bathroom is dripping continuously. Need plumber visit.',
    },
  });
  console.log(`✅ Created Maintenance Request: "${maintenance.title}" [Status: ${maintenance.status}]`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
