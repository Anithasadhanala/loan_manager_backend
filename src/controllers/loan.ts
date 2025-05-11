import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {hasAdminPermission} from "../utils/hasAdminPermission"
import { LoanStatusEnum } from '../constants/enums';
import { addMonths } from 'date-fns';
import { LoanStatus } from '@prisma/client';


const prisma = new PrismaClient();


export const createLoan = async (req: Request, res: Response): Promise<any> => {
    const { loan_category_id, amount, terms, interest_rate, collaterals } = req.body;
  
    try {
        const userId = req.user?.user_id;
        const loanRequest = await prisma.$transaction(async (prisma) => {
            const newLoanRequest = await prisma.loan_requests.create({
                data: {user_id: userId,  loan_category_id, amount, terms, interest_rate}
            });
            if (collaterals && Array.isArray(collaterals)) {
            await prisma.collaterals.createMany({
                data: collaterals.map((collateral) => ({
                loan_request_id: newLoanRequest.id,
                type: collateral.type,
                document_url: collateral.document_url,
                value_amount: collateral.value_amount,
                })),
            });
            }
            return newLoanRequest;
      });
  
      return res.status(201).json({
        message: 'Loan request and collaterals created successfully',
        loanRequest: loanRequest,
      });
    }  catch (error: any) {    
        return res.status(500).json({
          message: "Error creating user",
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
  };


export const getLoanById = async (req: Request, res: Response): Promise<any> => {
    try {
      const loanId = parseInt(req.params.id, 10);
      const userId = req.user?.user_id;
      const role = req.user?.role;
      const isAdmin = await hasAdminPermission(role);

      const loan = await prisma.loan_requests.findUnique({
        where: { id: loanId },
        include: {
          users_loan_requests_user_idTousers: true,
          loan_categories: true,
          collaterals: true,
          disbursements: true,
          emi_schedules: true,
        },
      });

      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }

      if (!isAdmin && loan.user_id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      return res.status(200).json({ loan });

    } catch (error: any) {
      console.error("Error fetching loan:", error);
      return res.status(500).json({
        message: "Error fetching loan",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  


   
export const getAllLoans = async (req: Request, res: Response): Promise<any> => {
  try {
    const role = req.user?.role;
    const isAdmin = await hasAdminPermission(role);
    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sort = req.query.sort;
    const loanRequests = await prisma.loan_requests.findMany({
      orderBy: sort === 'recent' ? { created_at: 'desc' } : undefined,
    });


    return res.status(200).json({
        loans: loanRequests,
    });

  } catch (error: any) {
      console.error("Error fetching loan requests:", error);
      return res.status(500).json({
          message: "Error fetching loan requests",
          error: error instanceof Error ? error.message : 'Unknown error',
      });
  }
};



export const updateLoanById = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.user_id;
    const loanId = parseInt(req.params.id, 10);
    const newStatus = req.body.status?.toUpperCase();
    const allowedStatuses = LoanStatusEnum;

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const role = req.user?.role;
    const isAdmin = await hasAdminPermission(role);

    if(!isAdmin && role!== 'Verifier'){
      return res.status(403).json({ message: "Sorry not permitted!" });
    }
    const loan = await prisma.loan_requests.findUnique({
      where: { id: loanId },
      include: {
        loan_categories: true,
        collaterals: true,
      },
    });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // If Verified
    if (newStatus=='VERIFIED') {
      if(loan.status != 'PENDING' ){
        return res.status(403).json({ message: "Already verified successfully!" });
      }
      const category = loan.loan_categories;
      if (!category) {
        return res.status(400).json({ message: "Loan category not found" });
      }
      if (
        loan.amount >= category.min_amount &&
        loan.amount <= category.max_amount &&
        loan.terms >= category.min_term &&
        loan.terms <= category.max_term &&
        loan.interest_rate >= category.interest_rate
      ) {
        return res.status(400).json({
          message: "Loan does not meet category requirements",
        });
      }

      const updatedLoan = await prisma.loan_requests.update({
        where: { id: loanId },
        data: { status: newStatus ,
          verified_by: userId,
          verified_at: new Date(),
        },
      });

      return res.status(200).json({ message: "Loan verified!", loan: updatedLoan });
    }
    // if Approved
    if (newStatus == 'APPROVED') {

      if(!isAdmin){
        return res.status(403).json({ message: "Sorry not permitted to approve!" });
      }

      if(loan.status!='VERIFIED'){
        return res.status(400).json({ message: "Already Approved successfully!" });
      }
      if (loan.collaterals.length === 0) {
        return res.status(400).json({ message: "At least one collateral is required to approve" });
      }

      const updatedLoan = await prisma.loan_requests.update({
        where: { id: loanId },
        data: {
          status: newStatus,
          approved_by: userId,
          approved_at: new Date(),
        },
      });
      // Proceed only if status is APPROVED, and add the EMIs in the emi schedules table.
      if (newStatus === 'APPROVED') {
        const termMonths = updatedLoan.terms;
        const principalPerMonth = Math.floor(updatedLoan.amount / termMonths);
        const interestRate = updatedLoan.interest_rate / 100;
        const interestPerMonth = Math.floor(updatedLoan.amount * interestRate / 12);

        const emiData = [];
        for (let i = 0; i < termMonths; i++) {
          emiData.push({
            loan_request_id: loanId,
            principal: principalPerMonth,
            interest: interestPerMonth,
            status: false,
            late_fee: 0,
            due_date: addMonths(new Date(), i),
          });
        }

        await prisma.emi_schedules.createMany({
          data: emiData,
        });
      }
      return res.status(200).json({ message: "Loan approved", loan: updatedLoan });
    }
  } catch (error: any) {
    console.error("Error updating loan status:", error);
    return res.status(500).json({ message: "Error updating loan status", error: error.message });
  }
};



export const getAllLoanEmiSchedules = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;    
    const loanId = parseInt(req.params.id, 10);
    const loan = await prisma.loan_requests.findUnique({
      where: { id: loanId },
      select: { user_id: true },
    });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const isAdmin = await hasAdminPermission(role);
    const isOwner = loan.user_id === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }

    const emiSchedules = await prisma.emi_schedules.findMany({
      where: { loan_request_id: loanId },
      orderBy: { due_date: 'asc' },
    });

    if (emiSchedules.length === 0) {
      return res.status(404).json({ message: "No EMI schedules found for this loan" });
    }
    return res.status(200).json({ emiSchedules });

  } catch (error: any) {
    console.error("Error fetching EMI schedules:", error);
    return res.status(500).json({
      message: "Error fetching EMI schedules",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getLoanStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const role = req.user?.role;    
    const isAdmin = await hasAdminPermission(role);

    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const totalLoans = await prisma.loan_requests.count();
    const totalBorrowers = await prisma.loan_requests.groupBy({
      by: ['user_id'],
      _count: { user_id: true },
    });

    const totalDisbursedCash = await prisma.loan_requests.aggregate({
      _sum: { amount: true},
      where: { status: 'RELEASED'},
    });

    const repaidLoansCount = await prisma.loan_requests.count({
      where: { status: 'COMPLETED'},
    });

    const totalCashReceived = await prisma.transactions.aggregate({
      _sum: { amount: true},
      where: { status: 'COMPLETED'},
    });

    return res.status(200).json({
      totalLoans,
      totalBorrowers: totalBorrowers.length,
      totalDisbursedCash: totalDisbursedCash._sum.amount || 0,
      repaidLoansCount,
      totalCashReceived: totalCashReceived._sum.amount || 0,
    });
  } catch (error: any) {
    console.error('Error fetching loan stats:', error);
    return res.status(500).json({
      message: 'Error fetching loan stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};




export const disburseLoanById = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.user_id;
    const role = req.user?.role;
    const loanId = parseInt(req.params.id, 10);
    const { payment_method, status } = req.body;

    // Ensure only admin can disburse
    const isAdmin = await hasAdminPermission(role);
    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const loan = await prisma.loan_requests.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }
    if (loan.status !== 'APPROVED') {
      return res.status(400).json({ message: "Loan must be in APPROVED state to disburse" });
    }

    const transaction = await prisma.transactions.create({
      data: {
        user_id: loan.user_id,
        loan_request_id: loanId,
        amount: loan.amount,
        payment_method,
        status,
      },
    });
  
    // Create disbursement record
    const disbursement = await prisma.disbursements.create({
      data: {
        loan_request_id: loanId,
        disbursed_by: userId,
        transaction_id: transaction.id,
        disbursed_at: new Date(),
      },
    });

    // Optionally update the loan status to RELEASED
    await prisma.loan_requests.update({
      where: { id: loanId },
      data: { status: 'RELEASED' },
    });

    return res.status(201).json({
      message: "Loan disbursed successfully",
      disbursement,
    });

  } catch (error: any) {
    console.error("Disbursement error:", error);
    return res.status(500).json({
      message: "Error during loan disbursement",
      error: error.message || "Unknown error",
    });
  }
};


export const getMonthlyStats = async (req: Request, res: Response):Promise<any> => {
  try {

    const userId = req.user?.user_id;
    const role = req.user?.role;

    // Ensure only admin can disburse stats monthly
    const isAdmin = await hasAdminPermission(role);
    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { year, status } = req.query;

    const rawStatus = Array.isArray(status) ? status[0] : status;

    if (!year || !rawStatus || typeof rawStatus !== 'string') {
      return res.status(400).json({ message: "Valid year and status are required!" });
    }

    const allowedStatuses: LoanStatus[] = ["PENDING", "VERIFIED", "RELEASED","OUTSTANDING"];
    if (!allowedStatuses.includes(rawStatus as LoanStatus)) {
      return res.status(400).json({ message: "Invalid loan status!" });
    }

    const loans = await prisma.loan_requests.findMany({
      where: {
        status: rawStatus as LoanStatus,
        approved_at: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${+year + 1}-01-01T00:00:00.000Z`)
        }
      },
      select: {
        amount: true,
        approved_at: true
      }
    });

    const monthlyTotals: { [month: string]: number } = {};
    for (let i = 1; i <= 12; i++) {
      const key = i.toString().padStart(2, '0');
      monthlyTotals[key] = 0;
    }
    loans.forEach(loan => {
      if (loan.approved_at) {
        const month = new Date(loan.approved_at).getMonth() + 1;
        const key = month.toString().padStart(2, '0');
        monthlyTotals[key] += loan.amount;
      }
    });
    
    return res.status(200).json({
      year,
      monthlyDisbursedLoans: monthlyTotals
    });
  }catch (error: any) {
    console.error("Error fetching monthly loan disbursements:", error);
    return res.status(500).json({
      message: "Error fetching monthly loan disbursements",
      error: error.message || "Unknown error",
    });
  }
};
