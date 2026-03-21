import { WalletRepositoryPort } from '../../ports/repositories/wallet.repository.port';

export class GetBalanceUseCase {
  constructor(private readonly walletRepository: WalletRepositoryPort) {}

  async execute(walletId: string): Promise<{ balanceCents: number; frozen: boolean }> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    return {
      balanceCents: wallet.balance.value,
      frozen: wallet.frozen,
    };
  }
}
