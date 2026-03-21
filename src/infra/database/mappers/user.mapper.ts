import { User as PrismaUser } from '@prisma/client';
import { User } from '../../../domain/entities/user.entity';
import { EmailVO } from '../../../domain/value-objects/email.vo';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.reconstitute(
      raw.id,
      EmailVO.of(raw.email),
      raw.passwordHash,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(user: User): PrismaUser {
    return {
      id: user.id,
      email: user.email.value,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
