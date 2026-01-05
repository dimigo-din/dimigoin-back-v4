import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiProperty, ApiResponse } from "@nestjs/swagger";

export function ApiResponseFormat<
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  TModel extends Type<unknown> | Function | [Function] | string,
>(options: {
  status: number | "default" | "1XX" | "2XX" | "3XX" | "4XX" | "5XX";
  type?: TModel;
  description?: string;
}) {
  if (!options.type) {
    return applyDecorators(
      ApiResponse({
        status: options.status,
        description: options.description,
      }),
    );
  }

  const isArray = Array.isArray(options.type);
  const type = Array.isArray(options.type)
    ? (options.type[0] as Type<unknown>)
    : (options.type as Type<unknown>);

  // ApiExtraModels(type);

  class WrapperDTO {
    @ApiProperty({ example: true })
    ok: boolean;

    @ApiProperty({ type: type, isArray: isArray })
    data: TModel;
  }

  Object.defineProperty(WrapperDTO, "name", {
    value: `Wrapper_Response${type.name}${isArray ? "Array" : ""}`,
  });

  return applyDecorators(
    ApiExtraModels(WrapperDTO),
    ApiResponse({
      status: options.status,
      type: WrapperDTO,
      isArray: isArray,
      description: options.description,
    }),
  );
}
