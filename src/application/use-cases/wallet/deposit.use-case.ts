import { WalletRepositoryPort } from '../../ports/repositories/wallet.repository.port';
import { TransactionRepositoryPort } from '../../ports/repositories/transaction.repository.port';
import { MoneyVO } from '../../../domain/value-objects/money.vo';
import { Transaction } from '../../../domain/entities/transaction.entity';
export type DepositUseCaseInput = {
  amountCents: number;
};

export class DepositUseCase {
  constructor(
    private readonly walletRepository: WalletRepositoryPort,
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(walletId: string, dto: DepositUseCaseInput): Promise<Transaction> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const amount = MoneyVO.of(dto.amountCents);
    wallet.credit(amount);

    const transaction = Transaction.createDeposit(walletId, amount);
    transaction.complete();

    await this.transactionRepository.saveDeposit(transaction, wallet);

    return transaction;
  }
}
