import { User } from '../../../domain/entities/user.entity';

export class UserPresenter {
  static toHttp(user: User) {
    return {
      id: user.id,
      email: user.email.value,
      createdAt: user.createdAt,
    };
  }
}
