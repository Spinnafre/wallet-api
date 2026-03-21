import { describe, it, expect } from 'vitest';
import { Wallet } from '../../../src/domain/entities/wallet.entity';
import { MoneyVO } from '../../../src/domain/value-objects/money.vo';
import {
  InsufficientFundsError,
  WalletFrozenError,
} from '../../../src/domain/errors/domain-errors';

describe('Wallet Entity', () => {
  it('should create a new wallet with zero balance', () => {
    const wallet = Wallet.create('user-1');
    expect(wallet.userId).toBe('user-1');
    expect(wallet.balance.value).toBe(0);
    expect(wallet.frozen).toBe(false);
  });

  it('should credit money and increase balance', () => {
    const wallet = Wallet.create('user-1');
    wallet.credit(MoneyVO.of(100));
    expect(wallet.balance.value).toBe(100);
  });

  it('should debit money if suficient funds exist', () => {
    const wallet = Wallet.create('user-1');
    wallet.credit(MoneyVO.of(100));
    wallet.debit(MoneyVO.of(50));
    expect(wallet.balance.value).toBe(50);
  });

  it('should throw InsufficientFundsError if trying to debit more than balance', () => {
    const wallet = Wallet.create('user-1');
    wallet.credit(MoneyVO.of(100));
    expect(() => wallet.debit(MoneyVO.of(150))).toThrow(InsufficientFundsError);
  });

  it('should allow forceDebit which results in negative balance and freezes wallet', () => {
    const wallet = Wallet.create('user-1');
    wallet.credit(MoneyVO.of(100));
    wallet.forceDebit(MoneyVO.of(150));
    expect(wallet.balance.value).toBe(-50);
    expect(wallet.frozen).toBe(true);
  });

  it('should not allow operations if wallet is frozen', () => {
    const wallet = Wallet.create('user-1');
    wallet.forceDebit(MoneyVO.of(10)); // freezes wallet
    expect(() => wallet.credit(MoneyVO.of(100))).toThrow(WalletFrozenError);
    expect(() => wallet.debit(MoneyVO.of(5))).toThrow(WalletFrozenError);
  });
});
