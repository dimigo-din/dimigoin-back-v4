import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

export function UseGuardsWithSwagger(...args) {
  return applyDecorators(ApiBearerAuth("access-token"), UseGuards(...args));
}
