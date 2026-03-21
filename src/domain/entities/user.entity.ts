import { randomUUID } from 'node:crypto';
import { EmailVO } from '../value-objects/email.vo';

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: EmailVO,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(email: EmailVO, passwordHash: string): User {
    const now = new Date();
    return new User(randomUUID(), email, passwordHash, now, now);
  }

  static reconstitute(
    id: string,
    email: EmailVO,
    passwordHash: string,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, email, passwordHash, createdAt, updatedAt);
  }
}
