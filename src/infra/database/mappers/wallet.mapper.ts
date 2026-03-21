import { Wallet as PrismaWallet } from '@prisma/client';
import { Wallet } from '../../../domain/entities/wallet.entity';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

export class WalletMapper {
  static toDomain(raw: PrismaWallet): Wallet {
    return Wallet.reconstitute(
      raw.id,
      raw.userId,
      MoneyVO.of(raw.balanceCents),
      raw.frozen,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(wallet: Wallet): PrismaWallet {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balanceCents: wallet.balance.value,
      frozen: wallet.frozen,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
