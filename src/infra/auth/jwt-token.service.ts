import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenServicePort } from '../../application/use-cases/auth/authenticate-user.use-case';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload);
  }
}
