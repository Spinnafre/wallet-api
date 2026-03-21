import { WalletRepositoryPort } from '../../ports/repositories/wallet.repository.port';
import { TransactionRepositoryPort } from '../../ports/repositories/transaction.repository.port';
import { MoneyVO } from '../../../domain/value-objects/money.vo';
import { Transaction } from '../../../domain/entities/transaction.entity';
export type TransferUseCaseInput = {
  targetWalletId: string;
  amountCents: number;
};

export class TransferUseCase {
  constructor(
    private readonly walletRepository: WalletRepositoryPort,
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(sourceWalletId: string, dto: TransferUseCaseInput): Promise<Transaction> {
    const sourceWallet = await this.walletRepository.findById(sourceWalletId);
    if (!sourceWallet) throw new Error('Source wallet not found');

    const targetWallet = await this.walletRepository.findById(dto.targetWalletId);
    if (!targetWallet) throw new Error('Target wallet not found');

    const amount = MoneyVO.of(dto.amountCents);

    sourceWallet.debit(amount);
    targetWallet.credit(amount);

    const transaction = Transaction.createTransfer(sourceWalletId, targetWallet.id, amount);
    transaction.complete();

    await this.transactionRepository.saveTransfer(transaction, sourceWallet, targetWallet);

    return transaction;
  }
}
