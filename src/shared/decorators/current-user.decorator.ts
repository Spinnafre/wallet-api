import { IJwtPayload } from '@infra/auth/jwt.strategy';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_: never, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: IJwtPayload }>();
  return request.user;
});
