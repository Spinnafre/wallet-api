export abstract class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientFundsError extends DomainError {
  constructor() {
    super('INSUFFICIENT_FUNDS', 'Insufficient funds to complete this operation');
  }
}

export class WalletFrozenError extends DomainError {
  constructor(message: string = 'Wallet is frozen') {
    super('WALLET_FROZEN', message);
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor() {
    super('TRANSACTION_NOT_FOUND', 'Transaction not found');
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor() {
    super('USER_ALREADY_EXISTS', 'User already exists');
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid credentials');
  }
}

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super('INVALID_OPERATION', message);
  }
}
