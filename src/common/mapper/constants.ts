import type { Type } from "@nestjs/common";
import {
  EtcScheduler,
  PrimaryScheduler,
  StayScheduler,
  VacationScheduler,
} from "../../routes/laundry/schedulers";
import type { LaundryTimelineScheduler } from "../../routes/laundry/schedulers/scheduler.interface";
import { generateRange } from "../utils/staySeat.util";
import type { LaundryTimelineSchedule } from "./types";

export const StaySeats = generateRange(["A1", "L18"]).concat(generateRange(["M1", "N7"]));

export const ACCESS_TOKEN_COOKIE = "access-token";
export const REFRESH_TOKEN_COOKIE = "refresh-token";

export const Allowed_Image_Extensions = ["jpg", "jpeg", "png"];
export const Allowed_Image_Signatures = [
  "89 50 4E 47 0D 0A 1A 0A", // png
  "FF D8 FF DB", // JPEG raw or in the JFIF or Exif file format
  "FF D8 FF E0 00 10 4A 46 49 46 00 01", // JPEG raw or in the JFIF or Exif file format
  "FF D8 FF EE", // JPEG raw or in the JFIF or Exif file format
  "FF D8 FF E1", // JPEG raw or in the JFIF or Exif file format
  "FF D8 FF E0", // 	JPEG raw or in the JFIF or Exif file format
  "00 00 00 0C 6A 50 20 20 0D 0A 87 0A", // JPEG 2000 format
].map((sig) => sig.replaceAll(" ", "").toLowerCase());

export const SelfDevelopment_Outing_From = (date: string) => `${date}T10:20:00.000+09:00`;
export const SelfDevelopment_Outing_To = (date: string) => `${date}T14:00:00.000+09:00`;

export const LaundrySchedulePriority: {
  schedule: LaundryTimelineSchedule;
  scheduler: Type<LaundryTimelineScheduler>;
}[] = [
  { schedule: "etc", scheduler: EtcScheduler },
  { schedule: "vacation", scheduler: VacationScheduler },
  { schedule: "stay", scheduler: StayScheduler },
  { schedule: "primary", scheduler: PrimaryScheduler },
];
