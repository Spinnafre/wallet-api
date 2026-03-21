import { Wallet } from '../../../domain/entities/wallet.entity';

export class WalletPresenter {
  static toHttp(wallet: Wallet) {
    return {
      id: wallet.id,
      balanceCents: wallet.balance.value,
      frozen: wallet.frozen,
      updatedAt: wallet.updatedAt,
    };
  }
}
