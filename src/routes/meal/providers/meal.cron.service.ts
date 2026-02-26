import { TZDate } from "@date-fns/tz";
import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { addDays, format } from "date-fns";
import { and, eq } from "drizzle-orm";
import { meal, mealTypeValues } from "#/db/schema";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";

interface MealApiResponse {
  data: {
    breakfast: { regular: string[]; simple: string[]; image: string };
    lunch: { regular: string[]; simple: string[]; image: string };
    dinner: { regular: string[]; simple: string[]; image: string };
  };
}

@Injectable()
export class MealCronService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Cron(CronExpression.EVERY_HOUR)
  async fetchAndStoreMeals() {
    const today = new TZDate(new Date(), "Asia/Seoul");
    for (let i = 0; i < 7; i++) {
      await this.fetchMealForDate(format(addDays(today, i), "yyyy-MM-dd"));
    }
  }

  async fetchMealForDate(date: string) {
    let json: MealApiResponse;
    try {
      const res = await fetch(`https://api.xn--rh3b.net/${date}`);
      if (!res.ok) {
        return;
      }
      json = (await res.json()) as MealApiResponse;
    } catch {
      return;
    }

    if (!json.data) {
      return;
    }

    for (const type of mealTypeValues) {
      const source = json.data[type];
      if (!source) {
        continue;
      }

      const existing = await this.db.query.meal.findFirst({
        where: { RAW: (t, { and, eq }) => and(eq(t.date, date), eq(t.type, type))! },
      });

      if (existing) {
        await this.db
          .update(meal)
          .set({
            regular: source.regular ?? [],
            simple: source.simple ?? [],
            image: source.image || null,
          })
          .where(and(eq(meal.date, date), eq(meal.type, type)));
      } else {
        await this.db.insert(meal).values({
          date,
          type,
          regular: source.regular ?? [],
          simple: source.simple ?? [],
          image: source.image || null,
        });
      }
    }
  }
}
