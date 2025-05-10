import { HttpException, HttpStatus } from "@nestjs/common";
import { FindOneOptions, Repository } from "typeorm";

import { ErrorMsg } from "../mapper/error";

export const safeFindOne = async <T>(
  repo: Repository<T>,
  condition: FindOneOptions<T>,
  error = new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND),
) => {
  const result = await repo.findOne(condition);
  if (!result) throw error;
  return result;
};
