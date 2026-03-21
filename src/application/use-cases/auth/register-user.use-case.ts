import { UserRepositoryPort } from '../../ports/repositories/user.repository.port';
import { WalletRepositoryPort } from '../../ports/repositories/wallet.repository.port';
import { HashServicePort } from '../../ports/services/hash.service.port';
import { RegisterDto } from '../../../infra/http/dtos/auth/register.dto';
import { UserAlreadyExistsError } from '../../../domain/errors/domain-errors';
import { EmailVO } from '../../../domain/value-objects/email.vo';
import { User } from '../../../domain/entities/user.entity';
import { Wallet } from '../../../domain/entities/wallet.entity';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly walletRepository: WalletRepositoryPort,
    private readonly hashService: HashServicePort,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    const emailVO = EmailVO.of(dto.email);
    const existingUser = await this.userRepository.findByEmail(emailVO);

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const passwordHash = await this.hashService.hash(dto.password);
    const user = User.create(emailVO, passwordHash);

    await this.userRepository.save(user);

    const wallet = Wallet.create(user.id);
    await this.walletRepository.save(wallet);

    return user;
  }
}
