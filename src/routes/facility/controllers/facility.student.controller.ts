import * as path from "node:path";
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  StreamableFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import type { User } from "#/db/schema";
import { CustomJwtAuthGuard } from "#auth/guards";
import { PermissionGuard } from "#auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { CurrentUser } from "$decorators/user.decorator";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { PermissionEnum } from "$mapper/permissions";
import {
  FacilityImgIdDTO,
  FacilityReportIdDTO,
  FacilityReportListResDTO,
  GetReportListDTO,
  PostCommentDTO,
  ReportFacilityDTO,
} from "~facility/dto/facility.student.dto";
import { ImageUploadInterceptor } from "~facility/interceptor/image-upload.interceptor";
import { FacilityStudentService } from "~facility/providers";

@ApiTags("Facility Student")
@Controller("/student/facility")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class FacilityStudentController {
  constructor(private readonly facilityService: FacilityStudentService) {}

  @ApiOperation({
    summary: "이미지 불러오기",
    description: "업로드된 이미지를 불러옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: StreamableFile,
  })
  @Get("/img")
  async getImg(@Res() res: FastifyReply, @Query() data: FacilityImgIdDTO) {
    const result = await this.facilityService.getImg(data);

    res.header("Content-Disposition", `attachment; filename="#{result.filename}"`);
    return res.send(result.stream);
  }

  @ApiOperation({
    summary: "시설 제보 목록",
    description: "시설 제보 목록을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [FacilityReportListResDTO],
  })
  @Get("/list")
  async getReportList(@Query() data: GetReportListDTO) {
    return await this.facilityService.reportList(data);
  }

  @ApiOperation({
    summary: "시설 제보 불러오기",
    description: "특정 시설 제보를 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Get("/")
  async getReport(@Query() data: FacilityReportIdDTO) {
    return await this.facilityService.getReport(data);
  }

  @ApiOperation({
    summary: "시설 제보",
    description: "고장나거나 개선사항이 필요한 시설을 제보합니다. 삭제가 불가능합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ReportFacilityDTO })
  @Post("/")
  @UseInterceptors(ImageUploadInterceptor)
  async report(@CurrentUser() user: User, @Body() data: ReportFacilityDTO) {
    const files = data.file || [];
    try {
      return await this.facilityService.createReport(user, data, files);
    } catch (_e) {
      for (const fileInfo of files) {
        const targetFile = Bun.file(
          path.join(process.cwd(), "uploads/facility", fileInfo.filename ?? ""),
        );
        if (await targetFile.exists()) {
          await targetFile.delete();
        }
      }
      throw _e;
    }
  }

  @ApiOperation({
    summary: "댓글 작성",
    description: "시설 제보문에 댓글을 추가합니다. 삭제가 불가능합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Post("/comment")
  async postComment(@CurrentUser() user: User, @Body() data: PostCommentDTO) {
    return await this.facilityService.writeComment(user, data);
  }
}
