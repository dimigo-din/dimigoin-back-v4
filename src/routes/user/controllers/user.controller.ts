import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { GetTimelineDTO } from "../dto/user.dto";
import { UserService } from "../providers";

@ApiTags("User")
@Controller("/user")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: "시간표 불러오기",
    description: "시간표를 불러옵니다. 컴시간에 기반합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/timeline")
  async getTimeline(@Query() data: GetTimelineDTO) {
    return this.userService.getTimeTable(data.grade, data.class);
  }
}
