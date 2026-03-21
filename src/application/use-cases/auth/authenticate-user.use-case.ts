import { UserRepositoryPort } from '../../ports/repositories/user.repository.port';
import { HashServicePort } from '../../ports/services/hash.service.port';
import { LoginDto } from '../../../infra/http/dtos/auth/login.dto';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors';
import { EmailVO } from '../../../domain/value-objects/email.vo';

export interface TokenServicePort {
  generateToken(payload: { sub: string; email: string }): string;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly hashService: HashServicePort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: LoginDto): Promise<{ accessToken: string }> {
    const emailVO = EmailVO.of(dto.email);
    const user = await this.userRepository.findByEmail(emailVO);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.hashService.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenService.generateToken({
      sub: user.id,
      email: user.email.value,
    });

    return { accessToken };
  }
}
