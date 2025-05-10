import { generateRange } from "../utils/staySeat.util";

export const StaySeats = [].concat(generateRange(["A1", "L18"]), generateRange(["M1", "N7"]));

export const ACCESS_TOKEN_COOKIE = "access-token";
export const REFRESH_TOKEN_COOKIE = "refresh-token";
