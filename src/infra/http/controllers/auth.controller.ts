import { Controller, Post, Body, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case';
import { AuthenticateUserUseCase } from '../../../application/use-cases/auth/authenticate-user.use-case';
import { registerSchema } from '../dtos/auth/register.dto';
import type { RegisterDto } from '../dtos/auth/register.dto';
import { loginSchema } from '../dtos/auth/login.dto';
import type { LoginDto } from '../dtos/auth/login.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { UserPresenter } from '../presenters/user.presenter';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto) {
    const user = await this.registerUserUseCase.execute(dto);
    return UserPresenter.toHttp(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiResponse({ status: 200, description: 'User successfully authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto) {
    const result = await this.authenticateUserUseCase.execute(dto);
    return result;
  }
}
