import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { IsNumber, IsString } from "nestjs-swagger-dto";

export class FileDTO {
  @ApiProperty()
  @IsString()
  fieldname: string;

  @ApiProperty()
  @IsString()
  originalname: string;

  @ApiProperty()
  @IsString()
  encoding: string;

  @ApiProperty()
  @IsString()
  mimetype: string;

  @ApiProperty()
  buffer: Buffer;

  @ApiProperty()
  @IsNumber()
  size: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  filename?: string;
}
