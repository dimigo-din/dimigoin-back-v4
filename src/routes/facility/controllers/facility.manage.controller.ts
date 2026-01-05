import fs from "node:fs";
import path from "node:path";

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { CurrentUser } from "../../../common/decorators/user.decorator";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { FacilityImg, FacilityReport, FacilityReportComment, User } from "../../../schemas";
import {
  ChangeFacilityReportStatusDTO,
  ChangeFacilityReportTypeDTO,
  FacilityImgIdDTO,
  FacilityReportCommentIdDTO,
  FacilityReportIdDTO,
  FacilityReportListResDTO,
  GetReportListDTO,
  PostCommentDTO,
  ReportFacilityDTO,
} from "../dto/facility.manage.dto";
import { ImageUploadInterceptor } from "../interceptor/image-upload.interceptor";
import { FacilityManageService } from "../providers";

@ApiTags("Facility Manage")
@Controller("/manage/facility")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.TEACHER]))
export class FacilityManageController {
  constructor(private readonly facilityManageService: FacilityManageService) {}

  @ApiOperation({
    summary: "사진 불러오기",
    description: "시설제보에 업로드된 사진을 가져옵니다.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: StreamableFile,
  })
  @Get("/img")
  async getImg(@Res() res: FastifyReply, @Query() data: FacilityImgIdDTO) {
    const result = await this.facilityManageService.getImg(data);
    console.log(result);

    res.header("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.stream);
  }

  @ApiOperation({
    summary: "사진 삭제하기",
    description: "첨부된 사진을 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityImg,
  })
  @Delete("/img")
  async deleteImg(@Query() data: FacilityImgIdDTO) {
    return await this.facilityManageService.deleteImg(data);
  }

  @ApiOperation({
    summary: "제보 목록 불러오기",
    description: "제보 목록을 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [FacilityReportListResDTO],
  })
  @Get("/list")
  async getReportList(@Query() data: GetReportListDTO) {
    return await this.facilityManageService.reportList(data);
  }

  @ApiOperation({
    summary: "제보 불러오기",
    description: "제보를 1건 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReport,
  })
  @Get("/")
  async getReport(@Query() data: FacilityReportIdDTO) {
    return await this.facilityManageService.getReport(data);
  }

  @ApiOperation({
    summary: "시설 제보",
    description: "고장나거나 개선사항이 필요한 시설을 제보합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReport,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ReportFacilityDTO })
  @Post("/")
  @UseInterceptors(ImageUploadInterceptor)
  async report(
    @Req() req: FastifyRequest & { files: any },
    @CurrentUser() user: User,
    @Body() data: ReportFacilityDTO,
  ) {
    const files = req.files?.file || [];
    try {
      return await this.facilityManageService.createReport(user, data, files);
    } catch (e) {
      console.log(e);
      files.forEach((f: any) =>
        fs.rmSync(path.join(__dirname, "./upload", f.filename), { force: true, recursive: true }),
      );
      throw e;
    }
  }

  @ApiOperation({
    summary: "시설 제보 삭제",
    description: "시설 제보를 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReport,
  })
  @Delete("/")
  async deleteReport(@Query() data: FacilityReportIdDTO) {
    return await this.facilityManageService.deleteReport(data);
  }

  @ApiOperation({
    summary: "댓글 작성",
    description: "시설 제보에 댓글을 작성합니다",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReportComment,
  })
  @Post("/comment")
  async writeComment(@CurrentUser() user: User, @Body() data: PostCommentDTO) {
    return await this.facilityManageService.writeComment(user, data);
  }

  @ApiOperation({
    summary: "댓글 삭제",
    description: "시설 제보에 작성된 댓글을 삭제합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReportComment,
  })
  @Delete("/comment")
  async deleteComment(@Query() data: FacilityReportCommentIdDTO) {
    return await this.facilityManageService.deleteComment(data);
  }

  @ApiOperation({
    summary: "시설 제보 성격 변경",
    description: "시설 제보의 성격을 변경합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReport,
  })
  @Patch("/type")
  async changeType(data: ChangeFacilityReportTypeDTO) {
    return await this.facilityManageService.changeType(data);
  }

  @ApiOperation({
    summary: "시설 제보 처리 진행상황 변경",
    description: "접수된 시설 제보의 처리 진행상황을 변경합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReport,
  })
  @Patch("/status")
  async changeStatus(@Body() data: ChangeFacilityReportStatusDTO) {
    return await this.facilityManageService.changeStatus(data);
  }
}
