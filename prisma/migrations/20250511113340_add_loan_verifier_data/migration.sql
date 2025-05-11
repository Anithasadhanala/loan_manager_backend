-- AlterTable
ALTER TABLE "loan_requests" ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" INTEGER;
