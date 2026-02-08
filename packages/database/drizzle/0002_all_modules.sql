CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."announcement_priority" AS ENUM('normal', 'important', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'task', 'event', 'finance', 'health', 'security', 'panic');--> statement-breakpoint
CREATE TYPE "public"."event_recurrence" AS ENUM('none', 'daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."event_attendee_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('general', 'birthday', 'appointment', 'reminder', 'holiday', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."medication_frequency" AS ENUM('once', 'daily', 'twice_daily', 'three_daily', 'weekly', 'as_needed');--> statement-breakpoint
CREATE TYPE "public"."access_action" AS ENUM('login', 'logout', 'failed_login', 'house_select', 'visitor_code_used', 'panic_triggered', 'vault_accessed');--> statement-breakpoint
CREATE TYPE "public"."vault_category" AS ENUM('wifi', 'alarm', 'safe', 'insurance', 'utility', 'subscription', 'other');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_id" uuid,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"house_id" uuid NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"language" varchar(10) DEFAULT 'es' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"dashboard_layout" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"author_id" uuid,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"priority" "announcement_priority" DEFAULT 'normal' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"sender_id" uuid,
	"content" text NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panic_pings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"triggered_by" uuid,
	"message" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "event_attendee_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"created_by" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" "event_type" DEFAULT 'general' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"all_day" boolean DEFAULT false NOT NULL,
	"recurrence" "event_recurrence" DEFAULT 'none' NOT NULL,
	"location" varchar(200),
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"house_id" uuid NOT NULL,
	"blood_type" "blood_type" DEFAULT 'unknown' NOT NULL,
	"allergies" text,
	"conditions" text,
	"emergency_notes" text,
	"doctor_name" varchar(150),
	"doctor_phone" varchar(30),
	"insurance_info" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"time_of_day" time,
	"days_of_week" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"user_id" uuid,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"was_skipped" boolean DEFAULT false NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"dosage" varchar(100),
	"frequency" "medication_frequency" DEFAULT 'daily' NOT NULL,
	"time_of_day" time,
	"instructions" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "access_action" NOT NULL,
	"ip_address" varchar(45),
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"relationship" varchar(50),
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secure_vault" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"created_by" uuid,
	"category" "vault_category" DEFAULT 'other' NOT NULL,
	"label" varchar(150) NOT NULL,
	"value" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"house_id" uuid NOT NULL,
	"created_by" uuid,
	"code" varchar(20) NOT NULL,
	"label" varchar(150) NOT NULL,
	"expires_at" timestamp with time zone,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panic_pings" ADD CONSTRAINT "panic_pings_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panic_pings" ADD CONSTRAINT "panic_pings_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panic_pings" ADD CONSTRAINT "panic_pings_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_routines" ADD CONSTRAINT "health_routines_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_routines" ADD CONSTRAINT "health_routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secure_vault" ADD CONSTRAINT "secure_vault_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secure_vault" ADD CONSTRAINT "secure_vault_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_codes" ADD CONSTRAINT "visitor_codes_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_codes" ADD CONSTRAINT "visitor_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;