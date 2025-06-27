import { Body, Controller, Get, HttpStatus, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { WakeupSongApplication } from "../../../schemas";
import { RegisterVideoDTO, SearchVideoDTO } from "../dto/wakeup.dto";
import { WakeupService } from "../providers";

@ApiTags("Wakeup")
@Controller("/wakeup")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class WakeupController {
  constructor(private readonly wakeupService: WakeupService) {}

  @ApiOperation({
    summary: "음악 검색",
    description: "유튜브에서 동영상을 검색합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    // type: ,
  })
  @Get("/search/music")
  async searchMusic(@Req() req, @Query() data: SearchVideoDTO) {
    return await this.wakeupService.search(req.user, data);
  }

  @ApiOperation({
    summary: "기상곡 신청",
    description: "Youtube Video Id를 이용하여 기상곡을 신청합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: WakeupSongApplication,
  })
  @Post("/")
  async registerVideo(@Req() req, @Body() data: RegisterVideoDTO) {
    return await this.wakeupService.registerVideo(req.user, data);
  }
}
