import { TZDate } from "@date-fns/tz";
import { Inject, Injectable } from "@nestjs/common";
import { format } from "date-fns";
import type { UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { andWhere } from "$utils/where.util";
import { GetStudentMealQueryDTO } from "~meal/dto/meal.dto";
import { UserManageService } from "~user/providers";

@Injectable()
export class MealStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
  ) {}

  private today() {
    return format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd");
  }

  async getMeal(userJwt: UserJWT, data: GetStudentMealQueryDTO) {
    const date = data.date ?? this.today();
    const userDetail = await this.userManageService.getUserDetail(userJwt.id);

    const [meals, timeline] = await Promise.all([
      this.db.query.meal.findMany({
        where: { RAW: (t, { eq }) => eq(t.date, date) },
      }),
      this.db.query.mealTimeline.findFirst({
        where: {
          RAW: (t, { and, lte, gte }) => andWhere(and, lte(t.start, date), gte(t.end, date)),
        },
        with: { slots: true, delays: true },
      }),
    ]);

    const getClassTime = (mealGrade: number, mealClass: number): string | undefined => {
      if (!timeline) {
        return undefined;
      }
      const slot = timeline.slots.find(
        (s) => s.grade === mealGrade && s.classes.includes(mealClass),
      );
      if (!slot) {
        return undefined;
      }
      const delay = timeline.delays.find((d) => d.date === date && d.source === slot.time);
      return delay ? delay.dest : slot.time;
    };

    const byType = Object.fromEntries(meals.map((m) => [m.type, m]));

    const breakfast = byType.breakfast;
    const lunch = byType.lunch;
    const dinner = byType.dinner;

    const classTime = userDetail ? getClassTime(userDetail.grade, userDetail.class) : undefined;

    return {
      breakfast: {
        regular: breakfast?.regular ?? [],
        simple: breakfast?.simple ?? [],
        image: breakfast?.image ?? null,
      },
      lunch: {
        regular: lunch?.regular ?? [],
        simple: lunch?.simple ?? [],
        image: lunch?.image ?? null,
        ...(classTime !== undefined ? { time: classTime } : {}),
      },
      dinner: {
        regular: dinner?.regular ?? [],
        simple: dinner?.simple ?? [],
        image: dinner?.image ?? null,
        ...(classTime !== undefined ? { time: classTime } : {}),
      },
    };
  }
}
