import { Wallet } from '../../../domain/entities/wallet.entity';

export interface WalletRepositoryPort {
  findById(id: string): Promise<Wallet | null>;
  findByUserId(userId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}
