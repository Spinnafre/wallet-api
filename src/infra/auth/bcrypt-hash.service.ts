import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashServicePort } from '../../application/ports/services/hash.service.port';
import { ConfigService } from '@nestjs/config';
import { IEnv } from '@config/env';

@Injectable()
export class BcryptHashService implements HashServicePort {
  private readonly saltRounds: number;
  constructor(@Inject(ConfigService) configService: ConfigService<IEnv, true>) {
    this.saltRounds = configService.get('BCRYPT_SALT_ROUNDS', { infer: true });
  }

  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, Number(this.saltRounds));
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}
