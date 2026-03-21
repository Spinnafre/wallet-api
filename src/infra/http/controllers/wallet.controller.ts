import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UsePipes,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

import { DepositUseCase } from '../../../application/use-cases/wallet/deposit.use-case';
import { TransferUseCase } from '../../../application/use-cases/wallet/transfer.use-case';
import { RevertTransactionUseCase } from '../../../application/use-cases/wallet/revert-transaction.use-case';
import { GetBalanceUseCase } from '../../../application/use-cases/shared/get-balance.use-case';
import type { WalletRepositoryPort } from '../../../application/ports/repositories/wallet.repository.port';

import { depositSchema } from '../dtos/wallet/deposit.dto';
import type { DepositDto } from '../dtos/wallet/deposit.dto';
import { transferSchema } from '../dtos/wallet/transfer.dto';
import type { TransferDto } from '../dtos/wallet/transfer.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { TransactionPresenter } from '../presenters/transaction.presenter';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly transferUseCase: TransferUseCase,
    private readonly revertTransactionUseCase: RevertTransactionUseCase,
    private readonly getBalanceUseCase: GetBalanceUseCase,
    @Inject('WalletRepositoryPort') private readonly walletRepository: WalletRepositoryPort,
  ) {}

  private async getWalletIdForUser(userId: string): Promise<string> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new NotFoundException('Wallet not found for current user');
    return wallet.id;
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get current wallet balance' })
  @ApiResponse({ status: 200, description: 'Returns wallet balance' })
  async getBalance(@CurrentUser() user: { id: string }) {
    const walletId = await this.getWalletIdForUser(user.id);
    const result = await this.getBalanceUseCase.execute(walletId);
    return result;
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit into wallet' })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  @UsePipes(new ZodValidationPipe(depositSchema))
  async deposit(@CurrentUser() user: { id: string }, @Body() dto: DepositDto) {
    const walletId = await this.getWalletIdForUser(user.id);
    const transaction = await this.depositUseCase.execute(walletId, dto);
    return TransactionPresenter.toHttp(transaction);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @UsePipes(new ZodValidationPipe(transferSchema))
  async transfer(@CurrentUser() user: { id: string }, @Body() dto: TransferDto) {
    const sourceWalletId = await this.getWalletIdForUser(user.id);
    const transaction = await this.transferUseCase.execute(sourceWalletId, dto);
    return TransactionPresenter.toHttp(transaction);
  }

  @Post('transactions/:transactionId/revert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction successfully reverted' })
  async revert(@CurrentUser() user: { id: string }, @Param('transactionId') transactionId: string) {
    const walletId = await this.getWalletIdForUser(user.id);
    const transaction = await this.revertTransactionUseCase.execute(walletId, transactionId);
    return TransactionPresenter.toHttp(transaction);
  }
}
