import { randomUUID } from 'node:crypto';
import { MoneyVO } from '../value-objects/money.vo';
import { InsufficientFundsError, WalletFrozenError } from '../errors/domain-errors';

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public balance: MoneyVO,
    public frozen: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(userId: string): Wallet {
    const now = new Date();
    return new Wallet(randomUUID(), userId, MoneyVO.of(0), false, now, now);
  }

  static reconstitute(
    id: string,
    userId: string,
    balance: MoneyVO,
    frozen: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): Wallet {
    return new Wallet(id, userId, balance, frozen, createdAt, updatedAt);
  }

  credit(amount: MoneyVO): void {
    if (this.frozen) {
      throw new WalletFrozenError('Cannot credit to a frozen wallet');
    }

    // INFO: Se o saldo de um usuário ficar negativo devido a um problema, nenhum depósito deve ser permitido
    if (this.balance.value < 0) {
      this.freeze();
      throw new WalletFrozenError('saldo negativo, carteira congelada');
    }

    this.balance = this.balance.add(amount);
  }

  forceDebit(amount: MoneyVO): void {
    const balanceAfterDebit = this.balance.subtract(amount);

    if (balanceAfterDebit.value < 0) {
      this.freeze();
    }

    this.balance = balanceAfterDebit;
  }

  debit(amount: MoneyVO): void {
    if (this.frozen) {
      throw new WalletFrozenError('Cannot debit from a frozen wallet');
    }

    const balanceAfterDebit = this.balance.subtract(amount);

    if (balanceAfterDebit.value < 0) {
      throw new InsufficientFundsError();
    }

    this.balance = balanceAfterDebit;
  }

  freeze(): void {
    this.frozen = true;
  }
}
