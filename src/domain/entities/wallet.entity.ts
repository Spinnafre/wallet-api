import { randomUUID } from 'crypto';
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

    // As per spec: Se saldo atual for negativo -> lancar WalletFrozenError "saldo negativo, carteira congelada"
    if (this.balance.value < 0) {
      this.freeze();
      throw new WalletFrozenError('saldo negativo, carteira congelada');
    }

    this.balance = this.balance.add(amount);
  }

  forceDebit(amount: MoneyVO): void {
    const mockBalanceAfterDebit = this.balance.subtract(amount);
    if (mockBalanceAfterDebit.value < 0) {
      this.freeze();
    }
    this.balance = mockBalanceAfterDebit;
  }

  debit(amount: MoneyVO): void {
    if (this.frozen) {
      throw new WalletFrozenError('Cannot debit from a frozen wallet');
    }

    const zero = MoneyVO.of(0);
    const mockBalanceAfterDebit = this.balance.subtract(amount);

    if (mockBalanceAfterDebit.value < 0) {
      throw new InsufficientFundsError();
    }

    this.balance = mockBalanceAfterDebit;
  }

  freeze(): void {
    this.frozen = true;
  }
}
