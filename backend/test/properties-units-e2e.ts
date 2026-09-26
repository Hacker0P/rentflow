import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

async function runPropertiesUnitsTests() {
  console.log('🧪 Starting Properties & Units Module Integration Tests...\n');

  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const server = await app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 4002;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const prisma = app.get(PrismaService);

  const emailLandlordA = 'rohan.varma@example.com';
  const emailLandlordB = 'sneha.reddy@example.com';

  // Clean test accounts
  await prisma.user.deleteMany({
    where: { email: { in: [emailLandlordA, emailLandlordB] } },
  });

  try {
    // ----------------------------------------------------
    // SETUP: Register Landlord A and Landlord B
    // ----------------------------------------------------
    const regARes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Varma',
        email: emailLandlordA,
        password: 'Password123!',
      }),
    });
    const tokenA = (await regARes.json()).data.accessToken;

    const regBRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Reddy',
        email: emailLandlordB,
        password: 'Password456!',
      }),
    });
    const tokenB = (await regBRes.json()).data.accessToken;

    console.log('✅ Setup: Registered Landlord A (Rohan) & Landlord B (Sneha)');

    // ----------------------------------------------------
    // TEST 1: Landlord A creates Property
    // ----------------------------------------------------
    console.log('\nTest 1: POST /api/v1/properties (Landlord A creates property)');
    const createPropRes = await fetch(`${baseUrl}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Sunrise Heights',
        address: '45 Marine Drive, Nariman Point, Mumbai 400021',
      }),
    });

    const propData = (await createPropRes.json()).data;
    if (createPropRes.status !== 201 || !propData?.id) {
      throw new Error(`Test 1 Failed: ${JSON.stringify(propData)}`);
    }
    const propertyId = propData.id;
    console.log(`  ✅ Property created: "${propData.name}" [ID: ${propertyId}]`);

    // ----------------------------------------------------
    // TEST 2: Landlord A lists properties (Verify stats with 0 units)
    // ----------------------------------------------------
    console.log('\nTest 2: GET /api/v1/properties (List properties with computed occupancy stats)');
    const listPropRes = await fetch(`${baseUrl}/properties`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = (await listPropRes.json()).data;
    const propSummary = listData.find((p: any) => p.id === propertyId);
    if (!propSummary || propSummary.stats.totalUnits !== 0) {
      throw new Error(`Test 2 Failed: Expected 0 units, got ${JSON.stringify(propSummary)}`);
    }
    console.log(`  ✅ Property listed. Stats verified: Total=${propSummary.stats.totalUnits}, Occupied=${propSummary.stats.occupiedUnits}, Vacant=${propSummary.stats.vacantUnits}`);

    // ----------------------------------------------------
    // TEST 3: Landlord A adds units to Property
    // ----------------------------------------------------
    console.log('\nTest 3: POST /api/v1/properties/:id/units (Add units A-101 and A-102)');
    const addUnit1Res = await fetch(`${baseUrl}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        unitNumber: 'A-101',
        floor: 1,
        status: 'VACANT',
      }),
    });
    const unit1 = (await addUnit1Res.json()).data;

    const addUnit2Res = await fetch(`${baseUrl}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        unitNumber: 'A-102',
        floor: 1,
        status: 'OCCUPIED',
      }),
    });
    const unit2 = (await addUnit2Res.json()).data;

    if (addUnit1Res.status !== 201 || addUnit2Res.status !== 201) {
      throw new Error('Test 3 Failed to create units');
    }
    console.log(`  ✅ Created Unit A-101 (${unit1.status}) [ID: ${unit1.id}]`);
    console.log(`  ✅ Created Unit A-102 (${unit2.status}) [ID: ${unit2.id}]`);

    // ----------------------------------------------------
    // TEST 4: Duplicate Unit Number Prevention
    // ----------------------------------------------------
    console.log('\nTest 4: POST /api/v1/properties/:id/units (Duplicate unit rejection)');
    const dupUnitRes = await fetch(`${baseUrl}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        unitNumber: 'A-101',
        floor: 1,
      }),
    });
    const dupJson = await dupUnitRes.json();
    if (dupUnitRes.status !== 409) {
      throw new Error(`Test 4 Failed: Expected 409, got ${dupUnitRes.status}`);
    }
    console.log(`  ✅ Duplicate unit properly rejected with 409 Conflict: "${dupJson.message}"`);

    // ----------------------------------------------------
    // TEST 5: Verify Updated Property Stats
    // ----------------------------------------------------
    console.log('\nTest 5: GET /api/v1/properties (Verify updated occupancy totals)');
    const listUpdatedRes = await fetch(`${baseUrl}/properties`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const updatedProp = (await listUpdatedRes.json()).data.find((p: any) => p.id === propertyId);
    if (updatedProp.stats.totalUnits !== 2 || updatedProp.stats.occupiedUnits !== 1 || updatedProp.stats.vacantUnits !== 1) {
      throw new Error(`Test 5 Failed: Unexpected stats ${JSON.stringify(updatedProp.stats)}`);
    }
    console.log(`  ✅ Stats verified: Total=${updatedProp.stats.totalUnits}, Occupied=${updatedProp.stats.occupiedUnits}, Vacant=${updatedProp.stats.vacantUnits}`);

    // ----------------------------------------------------
    // TEST 6: Strict Multi-Tenant / IDOR Isolation
    // ----------------------------------------------------
    console.log('\nTest 6: Multi-Tenant / IDOR Defense (Landlord B cannot access Landlord A\'s resources)');
    
    // Landlord B tries to view Landlord A's property
    const idorPropRes = await fetch(`${baseUrl}/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (idorPropRes.status !== 404) {
      throw new Error(`Test 6a Failed: Expected 404 for foreign property, got ${idorPropRes.status}`);
    }
    console.log('  ✅ IDOR Defense 1: Landlord B cannot access Landlord A\'s property (HTTP 404 Not Found)');

    // Landlord B tries to add a unit to Landlord A's property
    const idorAddUnitRes = await fetch(`${baseUrl}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ unitNumber: 'B-999' }),
    });
    if (idorAddUnitRes.status !== 404) {
      throw new Error(`Test 6b Failed: Expected 404 when adding unit to foreign property, got ${idorAddUnitRes.status}`);
    }
    console.log('  ✅ IDOR Defense 2: Landlord B cannot inject units into Landlord A\'s property (HTTP 404 Not Found)');

    // Landlord B tries to view Landlord A's unit
    const idorUnitRes = await fetch(`${baseUrl}/units/${unit1.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (idorUnitRes.status !== 404) {
      throw new Error(`Test 6c Failed: Expected 404 for foreign unit, got ${idorUnitRes.status}`);
    }
    console.log('  ✅ IDOR Defense 3: Landlord B cannot view or update Landlord A\'s unit (HTTP 404 Not Found)');

    // ----------------------------------------------------
    // TEST 7: Update Unit Status
    // ----------------------------------------------------
    console.log('\nTest 7: PATCH /api/v1/units/:id (Update unit status)');
    const patchUnitRes = await fetch(`${baseUrl}/units/${unit1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: 'OCCUPIED' }),
    });
    const patchedUnit = (await patchUnitRes.json()).data;
    if (patchedUnit.status !== 'OCCUPIED') {
      throw new Error(`Test 7 Failed: Expected OCCUPIED, got ${patchedUnit.status}`);
    }
    console.log(`  ✅ Unit A-101 status updated from VACANT to ${patchedUnit.status}`);

    // ----------------------------------------------------
    // TEST 8: Prevent Property Deletion when Units Exist
    // ----------------------------------------------------
    console.log('\nTest 8: DELETE /api/v1/properties/:id (Integrity check: Rejects deletion if units exist)');
    const deleteBlockedRes = await fetch(`${baseUrl}/properties/${propertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const deleteBlockedJson = await deleteBlockedRes.json();
    if (deleteBlockedRes.status !== 400) {
      throw new Error(`Test 8 Failed: Expected 400, got ${deleteBlockedRes.status}`);
    }
    console.log(`  ✅ Blocked deletion with 400 Bad Request: "${deleteBlockedJson.message}"`);

    // ----------------------------------------------------
    // TEST 9: Clean deletion flow (Delete units, then delete property)
    // ----------------------------------------------------
    console.log('\nTest 9: DELETE /api/v1/units/:id and DELETE /api/v1/properties/:id (Clean teardown)');
    await fetch(`${baseUrl}/units/${unit1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    await fetch(`${baseUrl}/units/${unit2.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('  ✅ Both units deleted.');

    const deletePropSuccessRes = await fetch(`${baseUrl}/properties/${propertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (deletePropSuccessRes.status !== 200) {
      throw new Error(`Test 9 Failed to delete empty property: ${deletePropSuccessRes.status}`);
    }
    console.log('  ✅ Empty property successfully deleted.');

    console.log('\n🎉 ALL 9 PROPERTY & UNIT MANAGEMENT TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Teardown test users
    await prisma.user.deleteMany({
      where: { email: { in: [emailLandlordA, emailLandlordB] } },
    });
    await app.close();
  }
}

runPropertiesUnitsTests().catch((err) => {
  console.error('❌ Property/Unit Test suite failed:', err);
  process.exit(1);
});
