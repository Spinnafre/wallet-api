import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferUseCase } from '../../../src/application/use-cases/wallet/transfer.use-case';
import { Wallet } from '../../../src/domain/entities/wallet.entity';
import { MoneyVO } from '../../../src/domain/value-objects/money.vo';
import { InsufficientFundsError } from '../../../src/domain/errors/domain-errors';

describe('TransferUseCase', () => {
  let walletRepoMock: any;
  let txRepoMock: any;
  let useCase: TransferUseCase;

  beforeEach(() => {
    walletRepoMock = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
    };
    txRepoMock = {
      findById: vi.fn(),
      saveDeposit: vi.fn(),
      saveTransfer: vi.fn(),
      saveReversion: vi.fn(),
      findByWalletId: vi.fn(),
    };
    useCase = new TransferUseCase(walletRepoMock, txRepoMock);
  });

  it('should transfer money successfully between wallets', async () => {
    const sourceWallet = Wallet.create('user-1');
    const targetWallet = Wallet.create('user-2');
    sourceWallet.credit(MoneyVO.of(1000));

    walletRepoMock.findById.mockResolvedValueOnce(sourceWallet);
    walletRepoMock.findById.mockResolvedValueOnce(targetWallet);

    const tx = await useCase.execute(sourceWallet.id, {
      targetWalletId: targetWallet.id,
      amountCents: 500,
    });

    expect(sourceWallet.balance.value).toBe(500);
    expect(targetWallet.balance.value).toBe(500);
    expect(tx.amount.value).toBe(500);
    expect(tx.type).toBe('TRANSFER');
    expect(tx.status).toBe('COMPLETED');
    expect(txRepoMock.saveTransfer).toHaveBeenCalledWith(tx, sourceWallet, targetWallet);
  });

  it('should throw InsufficientFundsError if source does not have enough balance', async () => {
    const sourceWallet = Wallet.create('user-1');
    const targetWallet = Wallet.create('user-2');
    sourceWallet.credit(MoneyVO.of(100));

    walletRepoMock.findById.mockResolvedValueOnce(sourceWallet);
    walletRepoMock.findById.mockResolvedValueOnce(targetWallet);

    await expect(
      useCase.execute(sourceWallet.id, {
        targetWalletId: targetWallet.id,
        amountCents: 500,
      }),
    ).rejects.toThrow(InsufficientFundsError);

    expect(txRepoMock.saveTransfer).not.toHaveBeenCalled();
  });
});
