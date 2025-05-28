import * as fs from "node:fs";
import * as path from "node:path";

import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
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
import { FacilityReport, FacilityReportComment } from "../../../schemas";
import {
  FacilityImgIdDTO,
  FacilityReportIdDTO,
  FacilityReportListResDTO,
  GetReportListDTO,
  PostCommentDTO,
  ReportFacilityDTO,
} from "../dto/facility.dto";
import { ImageUploadInterceptor } from "../interceptor/image-upload.interceptor";
import { FacilityService } from "../providers";

@ApiTags("Facility")
@Controller("/facility")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.STUDENT]))
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @ApiOperation({
    summary: "이미지 불러오기",
    description: "업로드된 이미지를 불러옵니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: StreamableFile,
  })
  @Get("/img")
  async getImg(@Res() res, @Query() data: FacilityImgIdDTO) {
    const result = await this.facilityService.getImg(data);
    console.log(result);

    res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
    result.stream.pipe(res);
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
    type: FacilityReport,
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
      return await this.facilityService.report(req.user, data, files.file);
    } catch (e) {
      console.log(e);
      files.file.forEach((f) =>
        fs.rmSync(path.join(__dirname, "./upload", f.filename), { force: true, recursive: true }),
      );
      throw e;
    }
  }

  @ApiOperation({
    summary: "댓글 작성",
    description: "시설 제보문에 댓글을 추가합니다. 삭제가 불가능합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: FacilityReportComment,
  })
  @Post("/comment")
  async postComment(@Req() req, @Body() data: PostCommentDTO) {
    return await this.facilityService.writeComment(req.user, data);
  }
}
