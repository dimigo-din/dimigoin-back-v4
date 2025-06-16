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
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CustomJwtAuthGuard } from "../../../auth/guards";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { UseGuardsWithSwagger } from "../../../auth/guards/useGuards";
import { ApiResponseFormat } from "../../../common/dto/response_format.dto";
import { PermissionEnum } from "../../../common/mapper/permissions";
import { FacilityImg, FacilityReport, FacilityReportComment } from "../../../schemas";
import {
  FacilityImgIdDTO,
  ReportFacilityDTO,
  FacilityReportIdDTO,
  FacilityReportListResDTO,
  GetReportListDTO,
  PostCommentDTO,
  FacilityReportCommentIdDTO,
  ChangeFacilityReportTypeDTO,
  ChangeFacilityReportStatusDTO,
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
  async getImg(@Res() res, @Query() data: FacilityImgIdDTO) {
    const result = await this.facilityManageService.getImg(data);
    console.log(result);

    res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
    result.stream.pipe(res);
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
    @Req() req,
    @Body() data: ReportFacilityDTO,
    @UploadedFiles() files: { file: Array<Express.Multer.File> },
  ) {
    try {
      return await this.facilityManageService.createReport(req.user, data, files.file);
    } catch (e) {
      console.log(e);
      files.file.forEach((f) =>
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
  async writeComment(@Req() req, @Body() data: PostCommentDTO) {
    return await this.facilityManageService.writeComment(req.user, data);
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
