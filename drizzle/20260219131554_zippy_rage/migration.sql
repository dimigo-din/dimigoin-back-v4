CREATE TYPE "meal_type_enum" AS ENUM('breakfast', 'lunch', 'dinner');--> statement-breakpoint
CREATE TABLE "meal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"date" date NOT NULL,
	"type" "meal_type_enum" NOT NULL,
	"regular" text[] NOT NULL,
	"simple" text[] DEFAULT '{}'::text[] NOT NULL,
	"image" varchar,
	"created_at" timestamp(6) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"start" date NOT NULL,
	"end" date NOT NULL,
	"created_at" timestamp(6) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_timeline_delay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"date" date NOT NULL,
	"source" varchar NOT NULL,
	"dest" varchar NOT NULL,
	"description" varchar NOT NULL,
	"timelineId" uuid NOT NULL,
	"created_at" timestamp(6) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_timeline_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"grade" integer NOT NULL,
	"time" varchar NOT NULL,
	"classes" integer[] NOT NULL,
	"timelineId" uuid NOT NULL
);
--> statement-breakpoint
CREATE INDEX "UQ_meal_date_type" ON "meal" ("date","type");--> statement-breakpoint
CREATE INDEX "IDX_meal_timeline_start_end" ON "meal_timeline" ("start","end");--> statement-breakpoint
CREATE INDEX "IDX_meal_slot_timeline_grade" ON "meal_timeline_slot" ("timelineId","grade");--> statement-breakpoint
ALTER TABLE "meal_timeline_delay" ADD CONSTRAINT "meal_timeline_delay_timelineId_meal_timeline_id_fkey" FOREIGN KEY ("timelineId") REFERENCES "meal_timeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "meal_timeline_slot" ADD CONSTRAINT "meal_timeline_slot_timelineId_meal_timeline_id_fkey" FOREIGN KEY ("timelineId") REFERENCES "meal_timeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;