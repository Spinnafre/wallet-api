import { Transaction as PrismaTransaction } from '@prisma/client';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

export class TransactionMapper {
  static toDomain(raw: PrismaTransaction): Transaction {
    return Transaction.reconstitute(
      raw.id,
      raw.type,
      raw.status,
      raw.sourceWalletId,
      raw.targetWalletId,
      MoneyVO.of(raw.amountCents),
      raw.revertedAt,
      raw.createdAt,
    );
  }

  static toPersistence(transaction: Transaction): PrismaTransaction {
    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      sourceWalletId: transaction.sourceWalletId,
      targetWalletId: transaction.targetWalletId,
      amountCents: transaction.amount.value,
      revertedAt: transaction.revertedAt,
      createdAt: transaction.createdAt,
    };
  }
}
