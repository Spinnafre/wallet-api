import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletRepositoryPort } from '../../../../application/ports/repositories/wallet.repository.port';
import { Wallet } from '../../../../domain/entities/wallet.entity';
import { WalletMapper } from '../../mappers/wallet.mapper';

@Injectable()
export class PrismaWalletRepository implements WalletRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Wallet | null> {
    const raw = await this.prisma.wallet.findUnique({
      where: { id },
    });
    if (!raw) return null;
    return WalletMapper.toDomain(raw);
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    const raw = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!raw) return null;
    return WalletMapper.toDomain(raw);
  }

  async save(wallet: Wallet): Promise<void> {
    const data = WalletMapper.toPersistence(wallet);
    await this.prisma.wallet.upsert({
      where: { id: wallet.id },
      update: data,
      create: data,
    });
  }
}
