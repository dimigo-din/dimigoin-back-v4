import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsIn } from "class-validator";

import {
  PushNotificationSubject,
  PushNotificationSubjectIdentifier,
  PushNotificationSubjectIdentifierValues,
} from "../../../common/mapper/types";

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

export class GetSubscribedSubjectDTO {
  @ApiProperty()
  @IsString()
  deviceId: string;
}

export class SetSubscribeSubjectDTO {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiProperty({ type: Array, enum: PushNotificationSubjectIdentifierValues })
  @IsIn(PushNotificationSubjectIdentifierValues, { each: true })
  subjects: PushNotificationSubjectIdentifier[];
}

export class PushNotificationSubjectsResponseDTO {
  [key: PushNotificationSubjectIdentifier]: string;
}
