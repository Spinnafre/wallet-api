import { IEnv } from '@config/env';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import z from 'zod';

const jwtTokenPayloadSchema = z
  .object({
    sub: z.uuid(),
    email: z.email(),
  })
  .required();

export type IJwtPayload = z.infer<typeof jwtTokenPayloadSchema>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) configService: ConfigService<IEnv, true>) {
    const publicKey = configService.get('JWT_PUBLIC_KEY', { infer: true });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: IJwtPayload) {
    return jwtTokenPayloadSchema.parse(payload);
  }
}
