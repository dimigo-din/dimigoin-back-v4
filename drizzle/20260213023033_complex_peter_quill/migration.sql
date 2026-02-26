CREATE TYPE "public"."login_type_enum" AS ENUM('password', 'google');--> statement-breakpoint
CREATE TYPE "public"."facility_report_type_enum" AS ENUM('suggest', 'broken', 'danger');--> statement-breakpoint
CREATE TYPE "public"."frigo_timing_enum" AS ENUM('afterschool', 'dinner', 'after_1st_study', 'after_2nd_study');--> statement-breakpoint
CREATE TYPE "public"."gender_enum" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."laundry_machine_type_enum" AS ENUM('washer', 'dryer');--> statement-breakpoint
CREATE TYPE "public"."push_subject_identifier_enum" AS ENUM('SchoolInformation', 'Laundry', 'StayApplyReminder', 'WakeupSong');--> statement-breakpoint
CREATE TYPE "public"."stay_seat_target_enum" AS ENUM('1_male', '1_female', '2_male', '2_female', '3_male', '3_female');--> statement-breakpoint
CREATE TYPE "public"."permission_validation_type_enum" AS ENUM('permission', 'permission_group');--> statement-breakpoint
CREATE TABLE "login" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "login_type_enum" NOT NULL,
	"identifier1" text NOT NULL,
	"identifier2" text,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refreshToken" varchar NOT NULL,
	"sessionIdentifier" varchar NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_img" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"location" varchar NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"parentId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'Waiting' NOT NULL,
	"report_type" "facility_report_type_enum" NOT NULL,
	"subject" varchar NOT NULL,
	"body" varchar NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_report_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commentParentId" uuid,
	"parentId" uuid NOT NULL,
	"text" varchar NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frigo_apply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week" varchar NOT NULL,
	"timing" "frigo_timing_enum" NOT NULL,
	"reason" varchar,
	"audit_reason" varchar,
	"approved" boolean,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frigo_apply_period" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apply_start_day" integer NOT NULL,
	"apply_end_day" integer NOT NULL,
	"apply_start_hour" integer NOT NULL,
	"apply_end_hour" integer NOT NULL,
	"grade" integer NOT NULL,
	CONSTRAINT "frigo_apply_period_grade_unique" UNIQUE("grade")
);
--> statement-breakpoint
CREATE TABLE "laundry_apply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"laundryTimelineId" uuid NOT NULL,
	"laundryTimeId" uuid NOT NULL,
	"laundryMachineId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_machine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "laundry_machine_type_enum" NOT NULL,
	"name" varchar NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"enabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_time" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time" varchar NOT NULL,
	"grade" integer[] NOT NULL,
	"timelineId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_machine_laundry_time_laundry_time" (
	"laundryMachineId" uuid NOT NULL,
	"laundryTimeId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"scheduler" varchar,
	"enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "laundry_timeline_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "push_subject" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" "push_subject_identifier_enum" NOT NULL,
	"name" varchar NOT NULL,
	"subscriptionId" uuid NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"deviceId" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"stay_from" date NOT NULL,
	"stay_to" date NOT NULL,
	"outing_day" text[] NOT NULL,
	"staySeatPresetId" uuid,
	"parentId" uuid,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "stay_apply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stay_seat" varchar NOT NULL,
	"stayId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "stay_apply_period_stay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade" integer NOT NULL,
	"apply_start" timestamp with time zone NOT NULL,
	"apply_end" timestamp with time zone NOT NULL,
	"stayId" uuid
);
--> statement-breakpoint
CREATE TABLE "stay_apply_period_stay_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade" integer NOT NULL,
	"apply_start_day" integer NOT NULL,
	"apply_start_hour" integer NOT NULL,
	"apply_end_day" integer NOT NULL,
	"apply_end_hour" integer NOT NULL,
	"stayScheduleId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay_outing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reason" varchar NOT NULL,
	"breakfast_cancel" boolean NOT NULL,
	"lunch_cancel" boolean NOT NULL,
	"dinner_cancel" boolean NOT NULL,
	"from" varchar NOT NULL,
	"to" varchar NOT NULL,
	"approved" boolean,
	"audit_reason" varchar,
	"stayApplyId" uuid NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "stay_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"stay_from" integer NOT NULL,
	"stay_to" integer NOT NULL,
	"outing_day" integer[] NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"staySeatPresetId" uuid,
	CONSTRAINT "stay_schedule_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stay_seat_preset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"only_readingRoom" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay_seat_preset_range" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target" "stay_seat_target_enum" NOT NULL,
	"range" varchar NOT NULL,
	"staySeatPresetId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"picture" varchar NOT NULL,
	"permission" varchar DEFAULT '1' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "permission_validator" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "permission_validation_type_enum" NOT NULL,
	"key" varchar NOT NULL,
	"value" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wakeup_song_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar NOT NULL,
	"video_title" varchar NOT NULL,
	"video_thumbnail" varchar NOT NULL,
	"video_channel" varchar NOT NULL,
	"week" varchar NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"userId" uuid NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "wakeup_song_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar NOT NULL,
	"video_title" varchar NOT NULL,
	"date" date NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"up" integer NOT NULL,
	"down" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wakeup_song_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upvote" boolean NOT NULL,
	"wakeupSongApplicationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "login" ADD CONSTRAINT "login_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "facility_img" ADD CONSTRAINT "facility_img_parentId_facility_report_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."facility_report"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "facility_report" ADD CONSTRAINT "facility_report_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "facility_report_comment" ADD CONSTRAINT "facility_report_comment_commentParentId_facility_report_comment_id_fk" FOREIGN KEY ("commentParentId") REFERENCES "public"."facility_report_comment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "facility_report_comment" ADD CONSTRAINT "facility_report_comment_parentId_facility_report_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."facility_report"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_report_comment" ADD CONSTRAINT "facility_report_comment_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frigo_apply" ADD CONSTRAINT "frigo_apply_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_apply" ADD CONSTRAINT "laundry_apply_laundryTimelineId_laundry_timeline_id_fk" FOREIGN KEY ("laundryTimelineId") REFERENCES "public"."laundry_timeline"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "laundry_apply" ADD CONSTRAINT "laundry_apply_laundryTimeId_laundry_time_id_fk" FOREIGN KEY ("laundryTimeId") REFERENCES "public"."laundry_time"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "laundry_apply" ADD CONSTRAINT "laundry_apply_laundryMachineId_laundry_machine_id_fk" FOREIGN KEY ("laundryMachineId") REFERENCES "public"."laundry_machine"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "laundry_apply" ADD CONSTRAINT "laundry_apply_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "laundry_time" ADD CONSTRAINT "laundry_time_timelineId_laundry_timeline_id_fk" FOREIGN KEY ("timelineId") REFERENCES "public"."laundry_timeline"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "laundry_machine_laundry_time_laundry_time" ADD CONSTRAINT "laundry_machine_laundry_time_laundry_time_laundryMachineId_laundry_machine_id_fk" FOREIGN KEY ("laundryMachineId") REFERENCES "public"."laundry_machine"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "laundry_machine_laundry_time_laundry_time" ADD CONSTRAINT "laundry_machine_laundry_time_laundry_time_laundryTimeId_laundry_time_id_fk" FOREIGN KEY ("laundryTimeId") REFERENCES "public"."laundry_time"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subject" ADD CONSTRAINT "push_subject_subscriptionId_push_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."push_subscription"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "push_subject" ADD CONSTRAINT "push_subject_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay" ADD CONSTRAINT "stay_staySeatPresetId_stay_seat_preset_id_fk" FOREIGN KEY ("staySeatPresetId") REFERENCES "public"."stay_seat_preset"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stay" ADD CONSTRAINT "stay_parentId_stay_schedule_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."stay_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_apply" ADD CONSTRAINT "stay_apply_stayId_stay_id_fk" FOREIGN KEY ("stayId") REFERENCES "public"."stay"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stay_apply" ADD CONSTRAINT "stay_apply_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stay_apply_period_stay" ADD CONSTRAINT "stay_apply_period_stay_stayId_stay_id_fk" FOREIGN KEY ("stayId") REFERENCES "public"."stay"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stay_apply_period_stay_schedule" ADD CONSTRAINT "stay_apply_period_stay_schedule_stayScheduleId_stay_schedule_id_fk" FOREIGN KEY ("stayScheduleId") REFERENCES "public"."stay_schedule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stay_outing" ADD CONSTRAINT "stay_outing_stayApplyId_stay_apply_id_fk" FOREIGN KEY ("stayApplyId") REFERENCES "public"."stay_apply"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stay_schedule" ADD CONSTRAINT "stay_schedule_staySeatPresetId_stay_seat_preset_id_fk" FOREIGN KEY ("staySeatPresetId") REFERENCES "public"."stay_seat_preset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_seat_preset_range" ADD CONSTRAINT "stay_seat_preset_range_staySeatPresetId_stay_seat_preset_id_fk" FOREIGN KEY ("staySeatPresetId") REFERENCES "public"."stay_seat_preset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wakeup_song_application" ADD CONSTRAINT "wakeup_song_application_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wakeup_song_vote" ADD CONSTRAINT "wakeup_song_vote_wakeupSongApplicationId_wakeup_song_application_id_fk" FOREIGN KEY ("wakeupSongApplicationId") REFERENCES "public"."wakeup_song_application"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "wakeup_song_vote" ADD CONSTRAINT "wakeup_song_vote_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "IDX_frigo_apply_week_user" ON "frigo_apply" USING btree ("week","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_laundry_apply_date_time_machine" ON "laundry_apply" USING btree ("date","laundryTimeId","laundryMachineId");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_laundry_machine_type_name" ON "laundry_machine" USING btree ("type","name");--> statement-breakpoint
CREATE INDEX "IDX_laundry_time_machine" ON "laundry_machine_laundry_time_laundry_time" USING btree ("laundryMachineId","laundryTimeId");--> statement-breakpoint
CREATE INDEX "UQ_laundrytimeline_scheduler_not_etc" ON "laundry_timeline" USING btree ("scheduler");--> statement-breakpoint
CREATE INDEX "IDX_stay_from_to" ON "stay" USING btree ("stay_from","stay_to");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_stay_name_from_to" ON "stay" USING btree ("name","stay_from","stay_to");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_stay_apply_stay_user" ON "stay_apply" USING btree ("stayId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_stay_apply_period_stay_grade" ON "stay_apply_period_stay" USING btree ("stayId","grade");--> statement-breakpoint
CREATE INDEX "IDX_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_wakeup_video_week" ON "wakeup_song_application" USING btree ("video_id","week");--> statement-breakpoint
CREATE INDEX "IDX_wakeup_week_gender" ON "wakeup_song_application" USING btree ("week","gender");--> statement-breakpoint
CREATE UNIQUE INDEX "IDX_wakeup_vote_user_app" ON "wakeup_song_vote" USING btree ("userId","wakeupSongApplicationId");--> statement-breakpoint
CREATE INDEX "IDX_wakeup_vote_app_upvote" ON "wakeup_song_vote" USING btree ("wakeupSongApplicationId","upvote");