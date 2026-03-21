import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRepositoryPort } from '../../../../application/ports/repositories/user.repository.port';
import { User } from '../../../../domain/entities/user.entity';
import { EmailVO } from '../../../../domain/value-objects/email.vo';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: EmailVO): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!raw) return null;
    return UserMapper.toDomain(raw);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: data,
    });
  }
}
