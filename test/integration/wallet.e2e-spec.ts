/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';


type LooseWalletPort = {
  findByUserId: (userId: string) => Promise<{ id: string } | null>;
};

describe('Wallet Endpoints (e2e)', () => {
  let app: INestApplication;

  let userAId: string;
  let userAToken: string;
  let walletAId: string;

  let userBId: string;
  let userBToken: string;
  let walletBId: string;

  let transferTransactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const resA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `usera_${Date.now()}@test.com`, password: 'password123' })
      .expect(201);
    userAId = resA.body.id;

    const loginResA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: resA.body.email, password: 'password123' })
      .expect(200);
    userAToken = loginResA.body.accessToken;

    const resB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `userb_${Date.now()}@test.com`, password: 'password123' })
      .expect(201);
    userBId = resB.body.id;

    const loginResB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: resB.body.email, password: 'password123' })
      .expect(200);
    userBToken = loginResB.body.accessToken;

    const walletRepo = app.get('WalletRepositoryPort') as LooseWalletPort;

    const wA = await walletRepo.findByUserId(userAId);
    if (!wA) throw new Error('User A wallet not found');
    walletAId = wA.id;

    const wB = await walletRepo.findByUserId(userBId);
    if (!wB) throw new Error('User B wallet not found');
    walletBId = wB.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /wallet/deposit', () => {
    it('should successfully deposit money into user A wallet', async () => {
      const response = await request(app.getHttpServer())
        .post('/wallet/deposit')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amountCents: 5000 })
        .expect(200);

      expect(response.body.amountCents).toBe(5000);
      expect(response.body.type).toBe('DEPOSIT');
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.targetWalletId).toBe(walletAId);

      const balanceRes = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(balanceRes.body.balanceCents).toBe(5000);
    });
  });

  describe('POST /wallet/transfer', () => {
    it('should successfully transfer money from user A to user B', async () => {
      const response = await request(app.getHttpServer())
        .post('/wallet/transfer')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ targetWalletId: walletBId, amountCents: 1500 })
        .expect(200);

      expect(response.body.amountCents).toBe(1500);
      expect(response.body.type).toBe('TRANSFER');
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.sourceWalletId).toBe(walletAId);
      expect(response.body.targetWalletId).toBe(walletBId);

      transferTransactionId = response.body.id;

      const balanceA = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);
      expect(balanceA.body.balanceCents).toBe(3500);

      const balanceB = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);
      expect(balanceB.body.balanceCents).toBe(1500);
    });
  });

  describe('POST /wallet/transactions/:transactionId/revert', () => {
    it('should successfully revert the transfer transaction', async () => {
      const response = await request(app.getHttpServer())
        .post(`/wallet/transactions/${transferTransactionId}/revert`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body.status).toBe('REVERTED');
      expect(response.body.revertedAt).toBeDefined();
      expect(response.body.amountCents).toBe(1500);

      const balanceA = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);
      expect(balanceA.body.balanceCents).toBe(5000);

      const balanceB = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);
      expect(balanceB.body.balanceCents).toBe(0);
    });
  });
});
