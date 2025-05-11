-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'VERIFIED', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "loan_requests" ADD COLUMN     "status" "LoanStatus" NOT NULL DEFAULT 'PENDING';
