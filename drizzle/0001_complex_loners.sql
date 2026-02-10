CREATE TABLE "tenant_members" (
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_members_tenant_id_user_id_pk" PRIMARY KEY("tenant_id","user_id")
);

ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_members_tenant_email_idx" ON "tenant_members" USING btree ("tenant_id","email");
CREATE INDEX "tenant_members_email_idx" ON "tenant_members" USING btree ("email");
CREATE INDEX "cards_column_position_idx" ON "cards" USING btree ("column_id","position");
CREATE INDEX "columns_board_position_idx" ON "columns" USING btree ("board_id","position");