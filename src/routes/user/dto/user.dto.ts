import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

import { PermissionType } from "../../../common/mapper/permissions";
import { LoginType } from "../../../common/mapper/types";

export class CreateUserDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loginType: LoginType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identifier1: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identifier2: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SetUserDetailDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(3)
  grade: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(6)
  class: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(32)
  number: number;
}

export class SetPermissionDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  permissions: PermissionType[];
}
export class AddPermissionDTO extends SetPermissionDTO {}
export class RemovePermissionDTO extends SetPermissionDTO {}
