import { Body, Controller, Get, HttpStatus, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CustomJwtAuthGuard } from "#auth/guards";
import { PermissionGuard } from "#auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { PermissionEnum } from "$mapper/permissions";
import {
  GetMealTimelineQueryDTO,
  PatchMealTimelineDTO,
  PostMealTimelineDTO,
} from "~meal/dto/meal.dto";
import { MealDienenService } from "~meal/providers";

@ApiTags("Meal Dienen")
@Controller("/dienen/meal")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.DIENEN]))
export class MealDienenController {
  constructor(private readonly mealDienenService: MealDienenService) {}

  @ApiOperation({ summary: "급식 시간 조회" })
  @ApiResponseFormat({ status: HttpStatus.OK })
  @Get("/timeline")
  async getTimeline(@Query() data: GetMealTimelineQueryDTO) {
    return await this.mealDienenService.getTimeline(data);
  }

  @ApiOperation({ summary: "급식 시간 등록" })
  @ApiResponseFormat({ status: HttpStatus.CREATED })
  @Post("/timeline")
  async createTimeline(@Body() data: PostMealTimelineDTO) {
    await this.mealDienenService.createTimeline(data);
  }

  @ApiOperation({ summary: "급식 시간 미루기" })
  @ApiResponseFormat({ status: HttpStatus.CREATED })
  @Patch("/timeline")
  async delayTimeline(@Body() data: PatchMealTimelineDTO) {
    await this.mealDienenService.delayTimeline(data);
  }
}
