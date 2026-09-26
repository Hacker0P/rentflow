import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

async function runAuthTests() {
  console.log('🧪 Starting RentFlow Auth Module Integration Tests...\n');

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
  const port = typeof address === 'object' && address ? address.port : 4001;
  const baseUrl = `http://localhost:${port}/api/v1`;

  console.log(`📡 Test server running at ${baseUrl}\n`);

  const prisma = app.get(PrismaService);

  // Clean test user if previously existed
  const testEmail = 'priya.patel@example.com';
  await prisma.user.deleteMany({
    where: { email: testEmail },
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Register a new landlord
    // ----------------------------------------------------
    console.log('Test 1: POST /api/v1/auth/register (Valid registration)');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Patel',
        email: testEmail,
        password: 'SecurePassword123!',
      }),
    });

    const regJson = await regRes.json();
    if (regRes.status !== 201 || !regJson.data?.accessToken) {
      throw new Error(`Test 1 Failed: Expected status 201, got ${regRes.status}: ${JSON.stringify(regJson)}`);
    }
    console.log(`  ✅ Registered successfully. Access token received. Landlord ID: ${regJson.data.user.id}`);
    const registeredToken = regJson.data.accessToken;

    // ----------------------------------------------------
    // TEST 2: Duplicate email registration
    // ----------------------------------------------------
    console.log('\nTest 2: POST /api/v1/auth/register (Duplicate email rejection)');
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Priya',
        email: testEmail,
        password: 'AnotherPassword456!',
      }),
    });

    const dupJson = await dupRes.json();
    if (dupRes.status !== 409) {
      throw new Error(`Test 2 Failed: Expected status 409, got ${dupRes.status}: ${JSON.stringify(dupJson)}`);
    }
    console.log(`  ✅ Duplicate email properly rejected with 409 Conflict: "${dupJson.message}"`);

    // ----------------------------------------------------
    // TEST 3: Login with correct credentials
    // ----------------------------------------------------
    console.log('\nTest 3: POST /api/v1/auth/login (Valid credentials)');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!',
      }),
    });

    const loginJson = await loginRes.json();
    if (loginRes.status !== 200 || !loginJson.data?.accessToken) {
      throw new Error(`Test 3 Failed: Expected status 200, got ${loginRes.status}: ${JSON.stringify(loginJson)}`);
    }
    console.log(`  ✅ Logged in successfully. Token valid.`);
    const loginToken = loginJson.data.accessToken;

    // ----------------------------------------------------
    // TEST 4: Login with incorrect password
    // ----------------------------------------------------
    console.log('\nTest 4: POST /api/v1/auth/login (Invalid password rejection)');
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });

    const badLoginJson = await badLoginRes.json();
    if (badLoginRes.status !== 401) {
      throw new Error(`Test 4 Failed: Expected status 401, got ${badLoginRes.status}`);
    }
    console.log(`  ✅ Invalid login rejected with 401 Unauthorized: "${badLoginJson.message}"`);

    // ----------------------------------------------------
    // TEST 5: Access protected /auth/me with Bearer token
    // ----------------------------------------------------
    console.log('\nTest 5: GET /api/v1/auth/me (Authenticated profile access)');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${loginToken}`,
      },
    });

    const meJson = await meRes.json();
    if (meRes.status !== 200 || meJson.data?.email !== testEmail) {
      throw new Error(`Test 5 Failed: Expected status 200, got ${meRes.status}: ${JSON.stringify(meJson)}`);
    }
    if (meJson.data.passwordHash !== undefined) {
      throw new Error('Test 5 Failed: passwordHash should not be exposed in user profile!');
    }
    console.log(`  ✅ Successfully retrieved profile for "${meJson.data.name}" (${meJson.data.email})`);
    console.log(`  🔒 Security verified: passwordHash is not exposed.`);

    // ----------------------------------------------------
    // TEST 6: Access protected /auth/me without token
    // ----------------------------------------------------
    console.log('\nTest 6: GET /api/v1/auth/me (Unauthorized access rejection)');
    const unauthRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
    });

    const unauthJson = await unauthRes.json();
    if (unauthRes.status !== 401) {
      throw new Error(`Test 6 Failed: Expected status 401, got ${unauthRes.status}`);
    }
    console.log(`  ✅ Missing token rejected with 401 Unauthorized.`);

    console.log('\n🎉 ALL 6 AUTHENTICATION & SECURITY TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await app.close();
  }
}

runAuthTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
