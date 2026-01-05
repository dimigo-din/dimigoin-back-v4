import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

import { PermissionType } from "../../../common/mapper/permissions";
import { LoginType } from "../../../common/mapper/types";

export class CreateUserDTO {
  @ApiProperty()
  @IsString()
  loginType: LoginType;

  @ApiProperty()
  @IsString()
  identifier1: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  identifier2: string | null;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  picture: string;
}

export class SetUserDetailDTO {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(3)
  grade: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(6)
  class: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(32)
  number: number;
}

export class AddPasswordLoginDTO {
  @ApiProperty()
  @IsString()
  password: string;
}

export class SetPermissionDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsArray()
  permissions: PermissionType[];
}
export class AddPermissionDTO extends SetPermissionDTO {}
export class RemovePermissionDTO extends SetPermissionDTO {}

export class SearchUserDTO {
  @ApiProperty()
  @IsString()
  name: string;
}

export class RenderHTMLDTO {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  html: string;
}
