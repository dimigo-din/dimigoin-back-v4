import { HttpException, HttpStatus } from "@nestjs/common";
import { FindOneOptions, Repository } from "typeorm";
import { ErrorMsg } from "$mapper/error";

type IdTable = { id: string };

export const safeFindOne = async <T extends IdTable>(
  repo: Repository<T>,
  condition: FindOneOptions<T> | string,
  error?: HttpException | (() => HttpException),
) => {
  const result =
    typeof condition === "string"
      ? await repo.findOne({ where: { id: condition } } as FindOneOptions<T>)
      : await repo.findOne(condition);
  if (!result) {
    const err =
      typeof error === "function"
        ? error()
        : (error ?? new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND));
    throw err;
  }
  return result;
};
