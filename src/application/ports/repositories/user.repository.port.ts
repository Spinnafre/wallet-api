import { User } from '../../../domain/entities/user.entity';
import { EmailVO } from '../../../domain/value-objects/email.vo';

export interface UserRepositoryPort {
  findByEmail(email: EmailVO): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
