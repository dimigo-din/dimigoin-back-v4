import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateFCMTokenDTO {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiProperty()
  @IsString()
  expirationTime: string;
}

export class DeleteFCMTokenDTO {
  @ApiProperty()
  @IsString()
  token: string;
}
