import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth & Wallet Integration (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  const testEmail = `test_${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) should create user and return user data', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);

    expect(response.body.email).toBe(testEmail);
    expect(response.body.id).toBeDefined();
  });

  it('/auth/login (POST) should authenticate and return JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    jwtToken = response.body.accessToken;
  });

  it('/wallet/balance (GET) should return initialized balance 0', async () => {
    const response = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.balanceCents).toBe(0);
    expect(response.body.frozen).toBe(false);
  });
});
