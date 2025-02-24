import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { IsString } from "nestjs-swagger-dto";

export class PasswordLoginDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class JWTResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
