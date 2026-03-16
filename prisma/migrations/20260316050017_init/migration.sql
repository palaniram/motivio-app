-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "county" TEXT NOT NULL,
    "lead_type" TEXT NOT NULL,
    "owner_name" TEXT,
    "property_address" TEXT NOT NULL,
    "city" TEXT,
    "zip" TEXT,
    "filing_date" DATE,
    "loan_amount" DECIMAL(65,30),
    "trustee_name" TEXT,
    "source" TEXT,
    "source_file" TEXT,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "phone_1" TEXT,
    "phone_2" TEXT,
    "phone_3" TEXT,
    "email_1" TEXT,
    "email_2" TEXT,
    "mailing_address" TEXT,
    "estimated_value" DECIMAL(65,30),
    "estimated_equity" DECIMAL(65,30),
    "property_type" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(65,30),
    "sq_ft" INTEGER,
    "year_built" INTEGER,
    "last_sale_date" DATE,
    "last_sale_price" DECIMAL(65,30),
    "enrichment_source" TEXT,
    "raw_response" JSONB,
    "enriched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_summaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "subscription_status" TEXT,
    "subscription_id" TEXT,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_county_filing_date_idx" ON "leads"("county", "filing_date");

-- CreateIndex
CREATE INDEX "leads_lead_type_filing_date_idx" ON "leads"("lead_type", "filing_date");

-- CreateIndex
CREATE UNIQUE INDEX "leads_property_address_filing_date_key" ON "leads"("property_address", "filing_date");

-- CreateIndex
CREATE UNIQUE INDEX "enrichment_lead_id_key" ON "enrichment"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_summaries_lead_id_key" ON "ai_summaries"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- AddForeignKey
ALTER TABLE "enrichment" ADD CONSTRAINT "enrichment_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
