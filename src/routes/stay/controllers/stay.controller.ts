import { Controller, Get, HttpStatus, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { Stay } from "../../../schemas";
import { StayService } from "../providers";

@ApiTags("Stay")
@Controller("/stay")
export class StayController {
  constructor(private readonly stayService: StayService) {}

  @ApiOperation({
    summary: "잔류 목록",
    description: "활성화된 잔류 목록을 가져옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [Stay],
  })
  @UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
  @Get("")
  async getStayList(@Req() req) {
    return this.stayService.getStayList(req.user);
  }
}
