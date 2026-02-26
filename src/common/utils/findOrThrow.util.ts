import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorMsg } from "$mapper/error";

export const findOrThrow = async <T>(
  query: Promise<T | undefined>,
  error?: HttpException | (() => HttpException),
): Promise<T> => {
  const result = await query;
  if (!result) {
    const err =
      typeof error === "function"
        ? error()
        : (error ?? new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND));
    throw err;
  }
  return result;
};
