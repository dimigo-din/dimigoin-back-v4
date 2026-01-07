import { Body, Controller, Delete, Get, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "@/auth/guards";
import { PermissionGuard } from "@/auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "@/auth/guards/useGuards";
import { CurrentUser } from "@/common/decorators/user.decorator";
import { ApiResponseFormat } from "@/common/dto/response_format.dto";
import { PermissionEnum } from "@/common/mapper/permissions";
import { User, WakeupSongApplication, WakeupSongVote } from "@/schemas";
import {
  ApplicationsResponseDTO,
  RegisterVideoDTO,
  SearchVideoDTO,
  VoteIdDTO,
  VoteVideoDTO,
} from "../dto/wakeup.student.dto";
import { WakeupStudentService } from "../providers";

@ApiTags("Wakeup Student")
@Controller("/student/wakeup")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class WakeupStudentController {
  constructor(private readonly wakeupService: WakeupStudentService) {}

  @ApiOperation({
    summary: "음악 검색",
    description: "유튜브에서 동영상을 검색합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    // type: ,
  })
  @Get("/search")
  async searchMusic(@CurrentUser() user: User, @Query() data: SearchVideoDTO) {
    return await this.wakeupService.search(user, data);
  }

  @ApiOperation({
    summary: "기상곡 목록",
    description: "해당 주의 신청된 기상곡들과 해당 기상곡의 투표들을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: ApplicationsResponseDTO,
  })
  @Get("/")
  async getApplications(@CurrentUser() user: User) {
    return await this.wakeupService.getApplications(user);
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
  async registerVideo(@CurrentUser() user: User, @Body() data: RegisterVideoDTO) {
    return await this.wakeupService.registerVideo(user, data);
  }

  @ApiOperation({
    summary: "내 투표 목록",
    description: "본인의 투표 목록을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [WakeupSongVote],
  })
  @Get("/vote")
  async getMyVotes(@CurrentUser() user: User) {
    return await this.wakeupService.getMyVotes(user);
  }

  @ApiOperation({
    summary: "기상곡 투표",
    description: "신청된 기상곡을 투표합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.CREATED,
    type: WakeupSongVote,
  })
  @Post("/vote")
  async vote(@CurrentUser() user: User, @Body() data: VoteVideoDTO) {
    return await this.wakeupService.vote(user, data);
  }

  @ApiOperation({
    summary: "기상곡 투표 취소",
    description: "신청된 기상곡에 대한 지지를 철회합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: WakeupSongVote,
  })
  @Delete("/vote")
  async unVote(@CurrentUser() user: User, @Query() data: VoteIdDTO) {
    return await this.wakeupService.unVote(user, data);
  }
}
