import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { User } from "#/schemas";

export const currentUserFactory = (_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: User }>();
  return request.user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
