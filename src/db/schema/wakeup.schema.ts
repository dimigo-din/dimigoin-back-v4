import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { genderEnum } from "./laundry.schema";
import { user } from "./user.schema";

export const wakeupSongApplication = pgTable(
  "wakeup_song_application",
  {
    id: uuid().primaryKey().defaultRandom(),
    video_id: varchar("video_id").notNull(),
    video_title: varchar("video_title").notNull(),
    video_thumbnail: varchar("video_thumbnail").notNull(),
    video_channel: varchar("video_channel").notNull(),
    week: varchar().notNull(),
    gender: genderEnum().notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    deletedAt: timestamp("deletedAt", { mode: "date" }),
  },
  (t) => [
    uniqueIndex("IDX_wakeup_video_week").on(t.video_id, t.week),
    index("IDX_wakeup_week_gender").on(t.week, t.gender),
  ],
);

export const wakeupSongVote = pgTable(
  "wakeup_song_vote",
  {
    id: uuid().primaryKey().defaultRandom(),
    upvote: boolean().notNull(),
    wakeupSongApplicationId: uuid("wakeupSongApplicationId")
      .notNull()
      .references(() => wakeupSongApplication.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    deletedAt: timestamp("deletedAt", { mode: "date" }),
  },
  (t) => [
    uniqueIndex("IDX_wakeup_vote_user_app").on(t.userId, t.wakeupSongApplicationId),
    index("IDX_wakeup_vote_app_upvote").on(t.wakeupSongApplicationId, t.upvote),
  ],
);

export const wakeupSongHistory = pgTable("wakeup_song_history", {
  id: uuid().primaryKey().defaultRandom(),
  video_id: varchar("video_id").notNull(),
  video_title: varchar("video_title").notNull(),
  date: date().notNull(),
  gender: genderEnum().notNull(),
  up: integer().notNull(),
  down: integer().notNull(),
});
