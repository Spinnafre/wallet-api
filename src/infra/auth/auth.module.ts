import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { IEnv } from '@config/env';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { BcryptHashService } from './bcrypt-hash.service';
import { AuthenticateUserUseCase } from '@application/use-cases/auth/authenticate-user.use-case';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory(config: ConfigService<IEnv, true>) {
        const privateKey = config.get('JWT_PRIVATE_KEY', { infer: true });
        const publicKey = config.get('JWT_PUBLIC_KEY', { infer: true });

        return {
          signOptions: { algorithm: 'RS256' },
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
        };
      },
    }),
  ],
  providers: [
    JwtTokenService,
    PrismaService,
    JwtStrategy,
    { provide: 'HashServicePort', useClass: BcryptHashService },
    { provide: 'TokenServicePort', useClass: JwtTokenService },
    RegisterUserUseCase,
    AuthenticateUserUseCase,
  ],
  exports: [RegisterUserUseCase, AuthenticateUserUseCase, 'HashServicePort', 'TokenServicePort'],
})
export class AuthModule {}
