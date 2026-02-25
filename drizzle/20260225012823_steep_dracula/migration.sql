ALTER TABLE "push_subject" ALTER COLUMN "identifier" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "push_subject_identifier_enum";--> statement-breakpoint
CREATE TYPE "push_subject_identifier_enum" AS ENUM('school_information', 'laundry', 'stay_apply_reminder', 'wakeup_song');--> statement-breakpoint
ALTER TABLE "push_subject" ALTER COLUMN "identifier" SET DATA TYPE "push_subject_identifier_enum" USING "identifier"::"push_subject_identifier_enum";