import { Transaction } from '../../../domain/entities/transaction.entity';
import { Wallet } from '../../../domain/entities/wallet.entity';

export interface TransactionRepositoryPort {
  findById(id: string): Promise<Transaction | null>;
  saveDeposit(transaction: Transaction, wallet: Wallet): Promise<void>;
  saveTransfer(transaction: Transaction, sourceWallet: Wallet, targetWallet: Wallet): Promise<void>;
  saveReversion(
    transaction: Transaction,
    targetWallet: Wallet,
    sourceWallet?: Wallet,
  ): Promise<void>;
  findByWalletId(walletId: string): Promise<Transaction[]>;
}
