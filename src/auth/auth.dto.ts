import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { IsString } from "nestjs-swagger-dto";

export class PasswordLoginDTO {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class RedirectUriDTO {
  @ApiProperty()
  @IsString()
  redirect_uri?: string;
}

export class GoogleWebLoginDTO {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  redirect_uri: string;
}

export class GoogleAppLoginDTO {
  @ApiProperty()
  @IsString()
  idToken: string;
}

export class RefreshTokenDTO {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class JWTResponse {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class RunPersonalInformationVerifyTokenDTO {
  @ApiProperty()
  @IsString()
  token: string;
}
