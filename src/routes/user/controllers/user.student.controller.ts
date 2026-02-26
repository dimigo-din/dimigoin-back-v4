import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "#/db/schema";
import { CustomJwtAuthGuard } from "#auth/guards";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { CurrentUser } from "$decorators/user.decorator";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { ApplyResponseDTO } from "~user/dto/user.student.dto";
import { UserStudentService } from "~user/providers";

@ApiTags("User Student")
@Controller("/student/user")
@UseGuardsWithSwagger(CustomJwtAuthGuard)
export class UserStudentController {
  constructor(private readonly userService: UserStudentService) {}

  @ApiOperation({
    summary: "시간표 불러오기",
    description: "시간표를 불러옵니다. 컴시간에 기반합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/timeline")
  async getTimeline(@CurrentUser() user: User) {
    return this.userService.getTimeTable(user);
  }

  @ApiOperation({
    summary: "신청 모아보기",
    description: "유저의 신청들을 반환합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: ApplyResponseDTO,
  })
  @Get("/apply")
  async getApplies(@CurrentUser() user: User) {
    return await this.userService.getMyApplies(user);
  }
}
