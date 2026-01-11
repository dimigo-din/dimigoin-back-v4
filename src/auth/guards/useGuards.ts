import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

export function UseGuardsWithSwagger(...guards: Parameters<typeof UseGuards>) {
  return applyDecorators(ApiBearerAuth("access-token"), UseGuards(...guards));
}

export function UseGuardWhenProduction(...guards: Parameters<typeof UseGuards>) {
  return Bun.env.NODE_ENV === "prod" ? UseGuards(...guards) : () => {};
}
