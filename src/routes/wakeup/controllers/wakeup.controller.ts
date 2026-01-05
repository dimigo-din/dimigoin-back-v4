import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { WakeupSongHistory } from "../../../schemas";
import type { GetDateSongDTO } from "../dto/wakeup.dto";
import { WakeupService } from "../providers/wakeup.service";

@ApiTags("Wakeup")
@Controller("/wakeup")
export class WakeupController {
  constructor(private readonly wakeupService: WakeupService) {}

  @ApiOperation({
    summary: "기상송 히스토리",
    description: "해당 날짜에 재생된 기상곡을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: WakeupSongHistory,
  })
  @Get("/history")
  async getDateSong(@Query() data: GetDateSongDTO) {
    return await this.wakeupService.getDateSong(data);
  }
}
