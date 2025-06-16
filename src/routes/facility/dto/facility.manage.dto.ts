import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber, IsOptional, IsString, Matches } from "class-validator";

import {
  FacilityReportStatus,
  FacilityReportStatusValues,
  FacilityReportType,
  FacilityReportTypeValues,
} from "../../../common/mapper/types";
import { User } from "../../../schemas";

export class ReportFacilityDTO {
  @ApiProperty()
  @IsIn(FacilityReportTypeValues)
  report_type: FacilityReportType;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({
    type: "array",
    items: {
      type: "string",
      format: "binary",
    },
  })
  file: any;
}

export class PostCommentDTO {
  @ApiProperty()
  @IsString()
  post: string;

  @ApiProperty({ nullable: true })
  @IsString()
  @IsOptional()
  parent_comment: string | null;

  @ApiProperty()
  @IsString()
  text: string;
}

export class FacilityImgIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class GetReportListDTO {
  @ApiProperty({ required: false })
  @Matches(/[0-9]+/)
  @IsOptional()
  page: number;
}

export class FacilityReportIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class FacilityReportListResDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  report_type: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty({ type: () => User })
  user: User;
}

export class FacilityReportCommentIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class ChangeFacilityReportTypeDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsIn(FacilityReportTypeValues)
  type: FacilityReportType;
}

export class ChangeFacilityReportStatusDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsIn(FacilityReportStatusValues)
  status: FacilityReportStatus;
}
