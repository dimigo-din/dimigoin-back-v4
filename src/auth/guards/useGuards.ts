import { applyDecorators, type CanActivate, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

// biome-ignore lint/complexity/noBannedTypes: helper function
export function UseGuardsWithSwagger(...args: (CanActivate | Function)[]) {
  return applyDecorators(ApiBearerAuth('access-token'), UseGuards(...args));
}
