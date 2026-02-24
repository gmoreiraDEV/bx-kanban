CREATE TABLE IF NOT EXISTS "card_document_links" (
  "card_id" text NOT NULL,
  "page_id" text NOT NULL,
  "tenant_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "card_document_links_card_id_page_id_pk" PRIMARY KEY("card_id","page_id")
);

DO $$ BEGIN
 ALTER TABLE "card_document_links" ADD CONSTRAINT "card_document_links_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "card_document_links" ADD CONSTRAINT "card_document_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "card_document_links" ADD CONSTRAINT "card_document_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "card_document_links_card_idx" ON "card_document_links" USING btree ("card_id");
CREATE INDEX IF NOT EXISTS "card_document_links_page_idx" ON "card_document_links" USING btree ("page_id");
