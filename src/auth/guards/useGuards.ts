import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

export function UseGuardsWithSwagger(...guards: Parameters<typeof UseGuards>) {
  return applyDecorators(ApiBearerAuth("access-token"), UseGuards(...guards));
}
