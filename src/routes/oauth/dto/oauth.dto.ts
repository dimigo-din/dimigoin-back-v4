import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class OAuthClientListResponseDTO {
  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString()
  name: string;
}

export class OAuthClientIdDTO {
  @ApiProperty()
  @IsString()
  client_id: string;
}

export class CreateOAuthClientDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString({ each: true })
  redirect: string[];
}

export class SetOAuthClientRedirectDTO {
  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString({ each: true })
  redirect: string[];
}
