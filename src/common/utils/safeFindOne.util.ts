import { HttpException, HttpStatus } from "@nestjs/common";
import { FindOneOptions, Repository } from "typeorm";

import { ErrorMsg } from "../mapper/error";

type IdTable = { id: string };

export const safeFindOne = async <T extends IdTable>(
  repo: Repository<T>,
  condition: FindOneOptions<T> | string,
  error = new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND),
) => {
  const result =
    typeof condition === "string"
      ? await repo.findOne({ where: { id: condition } } as FindOneOptions<T>)
      : await repo.findOne(condition);
  if (!result) throw error;
  return result;
};
