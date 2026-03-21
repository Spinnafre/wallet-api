import { randomUUID } from 'crypto';
import { MoneyVO } from '../value-objects/money.vo';
import { InvalidOperationError } from '../errors/domain-errors';

export type TransactionType = 'DEPOSIT' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REVERTED';

export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly type: TransactionType,
    public status: TransactionStatus,
    public readonly sourceWalletId: string | null,
    public readonly targetWalletId: string,
    public readonly amount: MoneyVO,
    public revertedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static createDeposit(targetWalletId: string, amount: MoneyVO): Transaction {
    return new Transaction(
      randomUUID(),
      'DEPOSIT',
      'PENDING',
      null,
      targetWalletId,
      amount,
      null,
      new Date(),
    );
  }

  static createTransfer(
    sourceWalletId: string,
    targetWalletId: string,
    amount: MoneyVO,
  ): Transaction {
    return new Transaction(
      randomUUID(),
      'TRANSFER',
      'PENDING',
      sourceWalletId,
      targetWalletId,
      amount,
      null,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    type: TransactionType,
    status: TransactionStatus,
    sourceWalletId: string | null,
    targetWalletId: string,
    amount: MoneyVO,
    revertedAt: Date | null,
    createdAt: Date,
  ): Transaction {
    return new Transaction(
      id,
      type,
      status,
      sourceWalletId,
      targetWalletId,
      amount,
      revertedAt,
      createdAt,
    );
  }

  complete(): void {
    if (this.status !== 'PENDING') {
      throw new InvalidOperationError('Only pending transactions can be completed');
    }
    this.status = 'COMPLETED';
  }

  revert(): void {
    if (this.status !== 'COMPLETED') {
      throw new InvalidOperationError('somente transacoes completadas podem ser revertidas');
    }
    this.status = 'REVERTED';
    this.revertedAt = new Date();
  }
}
