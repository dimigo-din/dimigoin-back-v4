import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Matches, ValidateNested } from "class-validator";

export class GetMealTimelineQueryDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

export class MealTimelineSlotItemDTO {
  @ApiProperty()
  @IsString()
  time: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  class: number[];
}

export class MealTimelineDataDTO {
  @ApiProperty({ type: [MealTimelineSlotItemDTO], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealTimelineSlotItemDTO)
  "1"?: MealTimelineSlotItemDTO[];

  @ApiProperty({ type: [MealTimelineSlotItemDTO], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealTimelineSlotItemDTO)
  "2"?: MealTimelineSlotItemDTO[];

  @ApiProperty({ type: [MealTimelineSlotItemDTO], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealTimelineSlotItemDTO)
  "3"?: MealTimelineSlotItemDTO[];
}

export class PostMealTimelineDTO {
  @ApiProperty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  start: string;

  @ApiProperty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  end: string;

  @ApiProperty({ type: MealTimelineDataDTO })
  @ValidateNested()
  @Type(() => MealTimelineDataDTO)
  data: MealTimelineDataDTO;
}

export class PatchMealTimelineDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiProperty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsString()
  dest: string;

  @ApiProperty()
  @IsString()
  description: string;
}

export class GetStudentMealQueryDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
