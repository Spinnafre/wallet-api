import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashServicePort } from '../../application/ports/services/hash.service.port';

@Injectable()
export class BcryptHashService implements HashServicePort {
  private readonly saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

  async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}
