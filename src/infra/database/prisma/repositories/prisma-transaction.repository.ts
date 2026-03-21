import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionRepositoryPort } from '../../../../application/ports/repositories/transaction.repository.port';
import { Transaction } from '../../../../domain/entities/transaction.entity';
import { Wallet } from '../../../../domain/entities/wallet.entity';
import { TransactionMapper } from '../../mappers/transaction.mapper';
import { WalletMapper } from '../../mappers/wallet.mapper';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Transaction | null> {
    const raw = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!raw) return null;
    return TransactionMapper.toDomain(raw);
  }

  async saveDeposit(transaction: Transaction, wallet: Wallet): Promise<void> {
    const txData = TransactionMapper.toPersistence(transaction);
    const walletData = WalletMapper.toPersistence(wallet);

    await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: wallet.id }, data: walletData }),
      this.prisma.transaction.create({ data: txData }),
    ]);
  }

  async saveTransfer(
    transaction: Transaction,
    sourceWallet: Wallet,
    targetWallet: Wallet,
  ): Promise<void> {
    const txData = TransactionMapper.toPersistence(transaction);
    const srcData = WalletMapper.toPersistence(sourceWallet);
    const tgtData = WalletMapper.toPersistence(targetWallet);

    await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: sourceWallet.id }, data: srcData }),
      this.prisma.wallet.update({ where: { id: targetWallet.id }, data: tgtData }),
      this.prisma.transaction.create({ data: txData }),
    ]);
  }

  async saveReversion(
    transaction: Transaction,
    targetWallet: Wallet,
    sourceWallet?: Wallet,
  ): Promise<void> {
    const txData = TransactionMapper.toPersistence(transaction);
    const tgtData = WalletMapper.toPersistence(targetWallet);

    const operations: any[] = [
      this.prisma.wallet.update({ where: { id: targetWallet.id }, data: tgtData }),
      this.prisma.transaction.update({ where: { id: transaction.id }, data: txData }),
    ];

    if (sourceWallet) {
      const srcData = WalletMapper.toPersistence(sourceWallet);
      operations.push(this.prisma.wallet.update({ where: { id: sourceWallet.id }, data: srcData }));
    }

    await this.prisma.$transaction(operations);
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    const raws = await this.prisma.transaction.findMany({
      where: {
        OR: [{ sourceWalletId: walletId }, { targetWalletId: walletId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return raws.map((raw) => TransactionMapper.toDomain(raw));
  }
}
