ALTER TABLE "facility_report_comment" RENAME CONSTRAINT "facility_report_comment_commentParentId_facility_report_comment" TO "facility_report_comment_tSSaKfrSMFg6_fkey";--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) USING "created_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(6) USING "updated_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "facility_img" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) USING "created_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "facility_report" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) USING "created_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "facility_report_comment" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) USING "created_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "laundry_apply" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) USING "created_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "stay_schedule" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) USING "created_at"::timestamp(6);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "permission" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "facility_report_comment" DROP CONSTRAINT "facility_report_comment_tSSaKfrSMFg6_fkey", ADD CONSTRAINT "facility_report_comment_tSSaKfrSMFg6_fkey" FOREIGN KEY ("commentParentId") REFERENCES "facility_report_comment"("id");