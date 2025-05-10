export const ErrorMsg = {
  UserIdentifier_NotFound: () => "유저 식별 정보를 확인할 수 없습니다.",
  UserIdentifier_NotMatched: () => "유저 식별 정보가 일치하지 않습니다.",
  UserSession_NotFound: () => "유저 세션을 찾을 수 없습니다.",

  PermissionDenied_Resource: () => "이 리소스에 대한 권한이 없습니다.",
  PermissionDenied_Resource_Grade: () => "해당 학년에 이 리소스에 대한 권한이 없습니다.",
  PermissionDenied_Action: () => "이 작업에 대한 권한이 없습니다.",

  Resource_NotFound: () => "리소스를 찾을 수 없습니다.",
  ResourceAlreadyExists: () => "리소스가 이미 존재합니다.",

  InvalidParameter: () => "잘못된 매개변수가 있습니다.",

  Stay_AlreadyApplied: () => "이미 해당 잔류를 신청하였습니다.",
  StaySeat_Duplication: () => "이미 해당 좌석을 선택한 사람이 있습니다.",
  StaySeat_NotAllowed: () => "해당 좌석을 사용할 수 없습니다.",

  ProvidedTime_Invalid: () => "제공하신 시간이 조건에 충족하지 않습니다.",

  FrigoPeriod_NotExistsForGrade: () =>
    "해당 학년은 금요귀가 신청이 불가능합니다. 담임 선생님께 문의주세요.",
  FrigoPeriod_NotInApplyPeriod: (from_day, from_hour, to_hour, to_day) =>
    `금요귀가 신청기간이 아닙니다. 신청기간: ${from_day}요일 ${from_hour}시 ~ ${to_day}요일 ${to_hour}`,

  LaundryApply_AlreadyExists: () => "이미 세탁 신청을 하셨습니다.",
  LaundryMachine_AlreadyTaken: () => "이미 해당 세탁/건조기가 신청된 상태입니다.",

  GoogleOauthCode_Invalid: () => "제공하신 OAuth 인증 코드가 유효하지 않습니다.",
};
