import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  InsufficientFundsError,
  WalletFrozenError,
  TransactionNotFoundError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  InvalidOperationError,
} from '../../../domain/errors/domain-errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    if (
      exception instanceof InsufficientFundsError ||
      exception instanceof WalletFrozenError ||
      exception instanceof InvalidOperationError
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof TransactionNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof UserAlreadyExistsError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof InvalidCredentialsError) {
      status = HttpStatus.UNAUTHORIZED;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
