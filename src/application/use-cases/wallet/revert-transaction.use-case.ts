import { WalletRepositoryPort } from '../../ports/repositories/wallet.repository.port';
import { TransactionRepositoryPort } from '../../ports/repositories/transaction.repository.port';
import {
  TransactionNotFoundError,
  InvalidOperationError,
} from '../../../domain/errors/domain-errors';
import { Transaction } from '../../../domain/entities/transaction.entity';

export class RevertTransactionUseCase {
  constructor(
    private readonly walletRepository: WalletRepositoryPort,
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(walletId: string, transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) throw new TransactionNotFoundError();

    if (transaction.type === 'TRANSFER' && transaction.sourceWalletId !== walletId) {
      throw new InvalidOperationError('Only the sender can revert a transfer');
    }

    if (transaction.type === 'DEPOSIT' && transaction.targetWalletId !== walletId) {
      throw new InvalidOperationError('Only the receiver can revert a deposit');
    }

    transaction.revert();

    if (transaction.type === 'DEPOSIT') {
      const targetWallet = await this.walletRepository.findById(transaction.targetWalletId);
      if (!targetWallet) throw new Error('Target wallet not found');

      targetWallet.forceDebit(transaction.amount);

      await this.transactionRepository.saveReversion(transaction, targetWallet);
    } else if (transaction.type === 'TRANSFER') {
      const targetWallet = await this.walletRepository.findById(transaction.targetWalletId);
      if (!targetWallet) throw new Error('Target wallet not found');

      const sourceWallet = await this.walletRepository.findById(transaction.sourceWalletId!);
      if (!sourceWallet) throw new Error('Source wallet not found');

      targetWallet.forceDebit(transaction.amount);

      // We assume forcing a credit to source wallet could theoretically unfreeze it if $>0?
      // But spec just says "creditar na carteira de origem". The `credit` method will
      // check if it's frozen... wait, reverting a transaction shouldn't fail if the source wallet is frozen,
      // because we're GIVING them money back. Let's force credit as well to bypass `freeze` block wrapper if needed.
      // Actually Wallet.credit checks if it's frozen. Let's add `forceCredit` to Wallet to bypass frozen check.

      // Let's manually increment balance bypassing frozen check for reversion, but domain logic requires it.
      // So we will add `forceCredit` in another tool call.
      sourceWallet.credit(transaction.amount);

      await this.transactionRepository.saveReversion(transaction, targetWallet, sourceWallet);
    }

    return transaction;
  }
}
