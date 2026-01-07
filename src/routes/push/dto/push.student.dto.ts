import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

import {
  type PushNotificationSubjectIdentifier,
  PushNotificationSubjectIdentifierValues,
} from "@/common/mapper/types";

export class CreateFCMTokenDTO {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  deviceId: string;
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

  @ApiProperty({ type: Array, enum: PushNotificationSubjectIdentifierValues, isArray: true })
  @IsIn(PushNotificationSubjectIdentifierValues, { each: true })
  subjects: PushNotificationSubjectIdentifier[];
}

export class PushNotificationSubjectsResponseDTO {
  [key: PushNotificationSubjectIdentifier]: string;
}
