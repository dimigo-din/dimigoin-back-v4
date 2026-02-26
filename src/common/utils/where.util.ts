import type { SQL, SQLWrapper } from "drizzle-orm";

type AndOperator = (...conditions: Array<SQLWrapper | undefined>) => SQL | undefined;

export const andWhere = (and: AndOperator, ...conditions: Array<SQLWrapper | undefined>): SQL => {
  const clause = and(...conditions);
  if (!clause) {
    throw new Error("Invalid empty where clause.");
  }
  return clause;
};
