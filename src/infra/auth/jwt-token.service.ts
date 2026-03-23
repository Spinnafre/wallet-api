import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenServicePort } from '../../application/use-cases/auth/authenticate-user.use-case';
import { IJwtPayload } from './jwt.strategy';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: IJwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
