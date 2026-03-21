/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  makeCounterProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';

import { PrismaService } from './infra/database/prisma/prisma.service';
import { PrismaTransactionRepository } from './infra/database/prisma/repositories/prisma-transaction.repository';
import { PrismaUserRepository } from './infra/database/prisma/repositories/prisma-user.repository';
import { PrismaWalletRepository } from './infra/database/prisma/repositories/prisma-wallet.repository';

import { AuthenticateUserUseCase } from './application/use-cases/auth/authenticate-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { GetBalanceUseCase } from './application/use-cases/shared/get-balance.use-case';
import { DepositUseCase } from './application/use-cases/wallet/deposit.use-case';
import { RevertTransactionUseCase } from './application/use-cases/wallet/revert-transaction.use-case';
import { TransferUseCase } from './application/use-cases/wallet/transfer.use-case';

import { IEnv, validate } from '@config/env';
import { AuthModule } from '@infra/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './infra/http/controllers/auth.controller';
import { WalletController } from './infra/http/controllers/wallet.controller';
import { DomainExceptionFilter } from './infra/http/filters/domain-exception.filter';
import { MetricsInterceptor } from './infra/observability/metrics/metrics.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<IEnv, true>) => {
        const isProd = config.get('NODE_ENV', { infer: true }) === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            transport: isProd ? undefined : { target: 'pino-pretty' },
          },
        };
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    AuthModule,
  ],
  controllers: [AuthController, WalletController, AppController],
  providers: [
    PrismaService,
    AppService,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    }),
    { provide: 'UserRepositoryPort', useClass: PrismaUserRepository },
    { provide: 'WalletRepositoryPort', useClass: PrismaWalletRepository },
    { provide: 'TransactionRepositoryPort', useClass: PrismaTransactionRepository },
    {
      provide: RegisterUserUseCase,
      useFactory: (userRepo, walletRepo, hashService) =>
        new RegisterUserUseCase(userRepo, walletRepo, hashService),
      inject: ['UserRepositoryPort', 'WalletRepositoryPort', 'HashServicePort'],
    },
    {
      provide: AuthenticateUserUseCase,
      useFactory: (userRepo, hashService, tokenService) =>
        new AuthenticateUserUseCase(userRepo, hashService, tokenService),
      inject: ['UserRepositoryPort', 'HashServicePort', 'TokenServicePort'],
    },
    {
      provide: DepositUseCase,
      useFactory: (walletRepo, txRepo) => new DepositUseCase(walletRepo, txRepo),
      inject: ['WalletRepositoryPort', 'TransactionRepositoryPort'],
    },
    {
      provide: TransferUseCase,
      useFactory: (walletRepo, txRepo) => new TransferUseCase(walletRepo, txRepo),
      inject: ['WalletRepositoryPort', 'TransactionRepositoryPort'],
    },
    {
      provide: RevertTransactionUseCase,
      useFactory: (walletRepo, txRepo) => new RevertTransactionUseCase(walletRepo, txRepo),
      inject: ['WalletRepositoryPort', 'TransactionRepositoryPort'],
    },
    {
      provide: GetBalanceUseCase,
      useFactory: (walletRepo) => new GetBalanceUseCase(walletRepo),
      inject: ['WalletRepositoryPort'],
    },
  ],
})
export class AppModule {}
