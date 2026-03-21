import { Transaction } from '../../../domain/entities/transaction.entity';

export class TransactionPresenter {
  static toHttp(transaction: Transaction) {
    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      sourceWalletId: transaction.sourceWalletId,
      targetWalletId: transaction.targetWalletId,
      amountCents: transaction.amount.value,
      createdAt: transaction.createdAt,
      revertedAt: transaction.revertedAt,
    };
  }
}
