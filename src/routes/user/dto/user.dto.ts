import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

import { PermissionType } from "../../../common/mapper/permissions";

export class CreateUserDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nickname: string;
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
