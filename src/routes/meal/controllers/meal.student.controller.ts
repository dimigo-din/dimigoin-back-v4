import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "#/db/schema";
import { CustomJwtAuthGuard } from "#auth/guards";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { CurrentUser } from "$decorators/user.decorator";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { GetStudentMealQueryDTO } from "~meal/dto/meal.dto";
import { MealStudentService } from "~meal/providers";

@ApiTags("Meal Student")
@Controller("/student/meal")
@UseGuardsWithSwagger(CustomJwtAuthGuard)
export class MealStudentController {
  constructor(private readonly mealStudentService: MealStudentService) {}

  @ApiOperation({ summary: "급식 조회" })
  @ApiResponseFormat({ status: HttpStatus.OK })
  @Get()
  async getMeal(@CurrentUser() user: User, @Query() data: GetStudentMealQueryDTO) {
    return await this.mealStudentService.getMeal(user, data);
  }
}
