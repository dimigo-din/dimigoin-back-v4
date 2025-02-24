export const LoginTypeValues = ["password"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const CompilerTypeValues = ["gcc", "gpp", "node", "python"] as const;
export type CompilerType = (typeof CompilerTypeValues)[number];

export const ProblemCategoryValues = ["basic"] as const;
export type ProblemCategory = (typeof ProblemCategoryValues)[number];

export const UploadBufferIdentifierValues = ["problem_testcase_upload"] as const;
export type UploadBufferIdentifier = (typeof UploadBufferIdentifierValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

export const GameModeValues = ["1VS1"] as const;
export type GameMode = (typeof GameModeValues)[number];

export const RoomStatusValues = ["waiting_owner", "waiting", "starting", "playing"] as const;
export type RoomStatus = (typeof RoomStatusValues)[number];

export const CodeRunHistoryValues = [
  "correct",
  "wrong",
  "runtime_error",
  "timeout",
  "out_of_memory",
] as const;
export type CodeRunHistory = (typeof CodeRunHistoryValues)[number];

export type UserJWT = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  lvl: number;
  rating: number;
  permission: number;
  refresh: boolean;
  sessionIdentifier: string;
};

export type SocketUser = {
  userId: string;
  socketId: string | null;
};

export type MatchQueueElement = {
  connected: boolean;
  websocketInitId: string;
  user: string;
  rating: number;
};

export type MatchRoomElement = {
  websocketInitId: string;
  roomId: string;
  gameMode: GameMode;
  maxPlayer: number;
  roomOwner: SocketUser;
  roomStatus: RoomStatus;
  problems: string[];
  players: (SocketUser & {
    solves: boolean[];
  })[];
  history: {
    id: number;
    user: string;
    status: CodeRunHistory;
    timestamp: string;
  }[];
  issued: number;
};

export type TestCodeResult = {
  passed: boolean;
  testcases: string[][];
  error: string | null;
};

export type SubmitResult = { passed: boolean; error: string | null };
