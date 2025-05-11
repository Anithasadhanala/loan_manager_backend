-- CreateTable
CREATE TABLE "collaterals" (
    "id" SERIAL NOT NULL,
    "loan_request_id" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "document_url" VARCHAR(255),
    "value_amount" INTEGER NOT NULL,

    CONSTRAINT "collaterals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disbursements" (
    "id" SERIAL NOT NULL,
    "loan_request_id" INTEGER NOT NULL,
    "disbursed_by" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "additional_info" TEXT,
    "disbursed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emi_schedules" (
    "id" SERIAL NOT NULL,
    "loan_request_id" INTEGER NOT NULL,
    "principal" INTEGER NOT NULL,
    "interest" DOUBLE PRECISION NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "late_fee" INTEGER DEFAULT 0,
    "due_date" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "emi_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_categories" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "max_amount" INTEGER NOT NULL,
    "min_amount" INTEGER NOT NULL,
    "min_term" INTEGER NOT NULL,
    "max_term" INTEGER NOT NULL,

    CONSTRAINT "loan_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "loan_category_id" INTEGER NOT NULL,
    "terms" INTEGER NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(6),
    "remarks" TEXT,

    CONSTRAINT "loan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayments" (
    "id" SERIAL NOT NULL,
    "loan_request_id" INTEGER NOT NULL,
    "emi_schedule_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,

    CONSTRAINT "repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "loan_request_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_method" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "transaction_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_details" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bank_name" VARCHAR(20),
    "account_number" VARCHAR(20),
    "ifsc_code" VARCHAR(20),
    "bank_branch" VARCHAR(20),
    "upi" VARCHAR(20),

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30),
    "email" VARCHAR(30),
    "oauth_id" TEXT,
    "oauth_provider" VARCHAR(20),
    "type" VARCHAR(10) NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_details_user_id_key" ON "user_details"("user_id");

-- AddForeignKey
ALTER TABLE "collaterals" ADD CONSTRAINT "collaterals_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_disbursed_by_fkey" FOREIGN KEY ("disbursed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emi_schedules" ADD CONSTRAINT "emi_schedules_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_loan_category_id_fkey" FOREIGN KEY ("loan_category_id") REFERENCES "loan_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "repayments_emi_schedule_id_fkey" FOREIGN KEY ("emi_schedule_id") REFERENCES "emi_schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "repayments_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "repayments" ADD CONSTRAINT "repayments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
