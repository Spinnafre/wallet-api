import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
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
import { type IJwtPayload } from '@infra/auth/jwt.strategy';

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
  @ApiResponse({
    status: 200,
    description: 'Returns wallet balance',
    schema: {
      type: 'object',
      properties: {
        balanceCents: { type: 'number', example: 1000 },
        frozen: { type: 'boolean', example: false },
      },
    },
  })
  async getBalance(@CurrentUser() req: IJwtPayload) {
    const walletId = await this.getWalletIdForUser(req.sub);
    const result = await this.getBalanceUseCase.execute(walletId);
    return result;
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit into wallet' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amountCents: { type: 'number', minimum: 1, example: 5000 },
      },
      required: ['amountCents'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit successful',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        type: { type: 'string', example: 'DEPOSIT' },
        status: { type: 'string', example: 'COMPLETED' },
        sourceWalletId: { type: 'string', format: 'uuid', nullable: true },
        targetWalletId: { type: 'string', format: 'uuid' },
        amountCents: { type: 'number', example: 5000 },
        createdAt: { type: 'string', format: 'date-time' },
        revertedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  async deposit(
    @CurrentUser() req: IJwtPayload,
    @Body(new ZodValidationPipe(depositSchema)) dto: DepositDto,
  ) {
    console.log(dto);
    const walletId = await this.getWalletIdForUser(req.sub);
    const transaction = await this.depositUseCase.execute(walletId, dto);
    return TransactionPresenter.toHttp(transaction);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        targetWalletId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        amountCents: { type: 'number', minimum: 1, example: 1500 },
      },
      required: ['targetWalletId', 'amountCents'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer successful',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        type: { type: 'string', example: 'TRANSFER' },
        status: { type: 'string', example: 'COMPLETED' },
        sourceWalletId: { type: 'string', format: 'uuid' },
        targetWalletId: { type: 'string', format: 'uuid' },
        amountCents: { type: 'number', example: 1500 },
        createdAt: { type: 'string', format: 'date-time' },
        revertedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  async transfer(
    @CurrentUser() req: IJwtPayload,
    @Body(new ZodValidationPipe(transferSchema)) dto: TransferDto,
  ) {
    const sourceWalletId = await this.getWalletIdForUser(req.sub);
    const transaction = await this.transferUseCase.execute(sourceWalletId, dto);
    return TransactionPresenter.toHttp(transaction);
  }

  @Post('transactions/:transactionId/revert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert a transaction' })
  @ApiParam({
    name: 'transactionId',
    type: 'string',
    description: 'ID of the transaction to revert',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction successfully reverted',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        type: { type: 'string', example: 'TRANSFER' },
        status: { type: 'string', example: 'REVERTED' },
        sourceWalletId: { type: 'string', format: 'uuid', nullable: true },
        targetWalletId: { type: 'string', format: 'uuid', nullable: true },
        amountCents: { type: 'number', example: 1500 },
        createdAt: { type: 'string', format: 'date-time' },
        revertedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async revert(@CurrentUser() req: IJwtPayload, @Param('transactionId') transactionId: string) {
    const walletId = await this.getWalletIdForUser(req.sub);
    const transaction = await this.revertTransactionUseCase.execute(walletId, transactionId);
    return TransactionPresenter.toHttp(transaction);
  }
}
