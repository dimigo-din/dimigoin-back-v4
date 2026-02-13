import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import type { User } from "#/db/schema";

export const currentUserFactory = (_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: User }>();
  return request.user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
