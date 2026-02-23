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

    const getClassTimes = (
      mealGrade: number,
      mealClass: number,
    ): { lunch?: string; dinner?: string } => {
      if (!timeline) {
        return {};
      }

      const matchedSlots = timeline.slots
        .filter((s) => s.grade === mealGrade && s.classes.includes(mealClass))
        .sort((a, b) => a.time.localeCompare(b.time));

      const resolve = (slotTime: string) => {
        const delay = timeline.delays.find((d) => d.date === date && d.source === slotTime);
        return delay ? delay.dest : slotTime;
      };

      return {
        ...(matchedSlots[0] ? { lunch: resolve(matchedSlots[0].time) } : {}),
        ...(matchedSlots[1] ? { dinner: resolve(matchedSlots[1].time) } : {}),
      };
    };

    const byType = Object.fromEntries(meals.map((m) => [m.type, m]));

    const breakfast = byType.breakfast;
    const lunch = byType.lunch;
    const dinner = byType.dinner;

    const classTimes = userDetail ? getClassTimes(userDetail.grade, userDetail.class) : {};

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
        ...(classTimes.lunch !== undefined ? { time: classTimes.lunch } : {}),
      },
      dinner: {
        regular: dinner?.regular ?? [],
        simple: dinner?.simple ?? [],
        image: dinner?.image ?? null,
        ...(classTimes.dinner !== undefined ? { time: classTimes.dinner } : {}),
      },
    };
  }
}
