import { ApiProperty } from "@nestjs/swagger";
import type { LaundryApply, StayApply } from "#/db/schema";

export class ApplyResponseDTO {
  @ApiProperty()
  stayApply: StayApply;

  @ApiProperty()
  laundryApply: LaundryApply;
}

export interface CachedTimetable {
  content: string;
  temp: boolean;
}

export interface ComciData {
  분리?: number;
  강의실?: number;
  동시그룹?: number[][];
  자료147?: number[][][][];
  자료245?: string[][][][];
  자료446?: string[];
  자료481?: number[][][][];
  자료492?: string[];
}
