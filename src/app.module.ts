import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { JwtModule } from '@nestjs/jwt';

import { PrismaService } from './infra/database/prisma/prisma.service';
import { PrismaUserRepository } from './infra/database/prisma/repositories/prisma-user.repository';
import { PrismaWalletRepository } from './infra/database/prisma/repositories/prisma-wallet.repository';
import { PrismaTransactionRepository } from './infra/database/prisma/repositories/prisma-transaction.repository';

import { BcryptHashService } from './infra/auth/bcrypt-hash.service';
import { JwtTokenService } from './infra/auth/jwt-token.service';
import { JwtStrategy } from './infra/auth/jwt.strategy';

import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { AuthenticateUserUseCase } from './application/use-cases/auth/authenticate-user.use-case';
import { DepositUseCase } from './application/use-cases/wallet/deposit.use-case';
import { TransferUseCase } from './application/use-cases/wallet/transfer.use-case';
import { RevertTransactionUseCase } from './application/use-cases/wallet/revert-transaction.use-case';
import { GetBalanceUseCase } from './application/use-cases/shared/get-balance.use-case';

import { AuthController } from './infra/http/controllers/auth.controller';
import { WalletController } from './infra/http/controllers/wallet.controller';
import { DomainExceptionFilter } from './infra/http/filters/domain-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any },
    }),
  ],
  controllers: [AuthController, WalletController],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    PrismaService,
    { provide: 'UserRepositoryPort', useClass: PrismaUserRepository },
    { provide: 'WalletRepositoryPort', useClass: PrismaWalletRepository },
    { provide: 'TransactionRepositoryPort', useClass: PrismaTransactionRepository },
    { provide: 'HashServicePort', useClass: BcryptHashService },
    { provide: 'TokenServicePort', useClass: JwtTokenService },
    JwtStrategy,
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
