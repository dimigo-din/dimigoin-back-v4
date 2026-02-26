import { Inject, Injectable } from "@nestjs/common";
import type { UserJWT } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { GetStudentMealQueryDTO } from "~meal/dto/meal.dto";
import { UserManageService } from "~user/providers";
import { MealCommonService } from "./meal.common.service";

@Injectable()
export class MealStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly userManageService: UserManageService,
    private readonly commonService: MealCommonService,
  ) {}

  async getMeal(userJwt: UserJWT, data: GetStudentMealQueryDTO) {
    const date = data.date ?? this.commonService.today();
    const userDetail = await this.userManageService.getUserDetail(userJwt.id);

    const [meals, timeline] = await Promise.all([
      this.db.query.meal.findMany({
        where: { RAW: (t, { eq }) => eq(t.date, date) },
      }),
      this.commonService.findTimeline(date),
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

      return {
        ...(matchedSlots[0]
          ? { lunch: this.commonService.resolveTime(timeline.delays, date, matchedSlots[0].time) }
          : {}),
        ...(matchedSlots[1]
          ? { dinner: this.commonService.resolveTime(timeline.delays, date, matchedSlots[1].time) }
          : {}),
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
