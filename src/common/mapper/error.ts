export const ErrorMsg = {
  UserIdentifier_NotFound: () => [
    "UserIdentifier_NotFound",
    "유저 식별 정보를 확인할 수 없습니다.",
  ],
  UserIdentifier_NotMatched: () => [
    "UserIdentifier_NotMatched",
    "유저 식별 정보가 일치하지 않습니다.",
  ],
  UserSession_NotFound: () => ["UserSession_NotFound", "유저 세션을 찾을 수 없습니다."],

  PermissionDenied_Resource: () => [
    "PermissionDenied_Resource",
    "이 리소스에 대한 권한이 없습니다.",
  ],
  PermissionDenied_Resource_Grade: () => [
    "PermissionDenied_Resource_Grade",
    "해당 학년에 이 리소스에 대한 권한이 없습니다.",
  ],
  PermissionDenied_Action: () => ["PermissionDenied_Action", "이 작업에 대한 권한이 없습니다."],

  Resource_NotFound: () => ["Resource_NotFound", "리소스를 찾을 수 없습니다."],
  ResourceAlreadyExists: () => ["ResourceAlreadyExists", "리소스가 이미 존재합니다."],

  InvalidParameter: () => ["InvalidParameter", "잘못된 매개변수가 있습니다."],

  Stay_NotInApplyPeriod: () => ["Stay_NotInApplyPeriod", "해당 잔류 신청 기간이 아닙니다."],
  Stay_AlreadyApplied: () => ["Stay_AlreadyApplied", "이미 해당 잔류를 신청하였습니다."],
  StaySeat_Duplication: () => ["StaySeat_Duplication", "이미 선택된 좌석입니다."],
  StaySeat_NotAllowed: () => ["StaySeat_NotAllowed", "해당 좌석을 사용할 수 없습니다."],

  ProvidedTime_Invalid: () => ["ProvidedTime_Invalid", "제공하신 시간이 조건에 충족하지 않습니다."],

  Not_A_Valid_Image: () => [
    "Not_A_Valid_Image",
    "정상적인 이미지가 아니거나, 서버에서 처리할 수 없는 이미지입니다.",
  ],
  Invalid_Parent: () => [
    "Invalid_Parent",
    "전송된 댓글 부모의 포스트와 현재 댓글의 포스트가 일치하지 않습니다.",
  ],

  FrigoPeriod_NotExistsForGrade: () => [
    "FrigoPeriod_NotExistsForGrade",
    "해당 학년은 금요귀가 신청이 불가능합니다. 담임 선생님께 문의주세요.",
  ],
  FrigoPeriod_NotInApplyPeriod: (from_day, from_hour, to_hour, to_day) => [
    "FrigoPeriod_NotInApplyPeriod",
    `금요귀가 신청기간이 아닙니다. 신청기간: ${from_day}요일 ${from_hour}시 ~ ${to_day}요일 ${to_hour}`,
  ],
  Frigo_AlreadyApplied: () => ["Frigo_AlreadyApplied", "이미 금요귀가가 신청되었습니다."],

  LaundryApply_AlreadyExists: (type: "세탁" | "건조") => [
    "LaundryApply_AlreadyExists",
    `이미 ${type} 신청을 하셨습니다.`,
  ],
  LaundryMachine_AlreadyTaken: () => [
    "LaundryMachine_AlreadyTaken",
    "이미 해당 세탁/건조기가 신청된 상태입니다.",
  ],
  LaundryApplyIsAfterEightAM: () => [
    "LaundryApplyIsAfterEightAM",
    "세탁/건조 신청은 8시 이후 가능합니다.",
  ],

  GoogleOauthCode_Invalid: () => [
    "GoogleOauthCode_Invalid",
    "제공하신 OAuth 인증 코드가 유효하지 않습니다.",
  ],

  RateLimit_Exceeded: () => [
    "RateLimit_Exceeded",
    "초당 최대 요청 건수에 도달하였습니다. 잠시후에 다시 시도해주세요.",
  ],

  PersonalInformation_NotRegistered: () => [
    "PersonalInformation_NotRegistered",
    "먼저 dimiauth에서 개인정보 등록을 진행하여주세요.",
  ],

  NoWakeupInDate: () => ["NoWakeupInDate", "해당 날짜에 확정된 기상송이 없습니다."],
};
