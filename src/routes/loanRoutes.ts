import { Router } from "express";
import validate from "../middlewares/validateRequestParams";
import { createLoanRequest, updateLoanStatus } from "../validations/loan";
import { createLoan, getAllLoans, getLoanById, updateLoanById, getAllLoanEmiSchedules, getLoanStats, disburseLoanById } from "../controllers/loan";
import {verifyFirebaseToken} from "../middlewares/validateAuthToken"

const router = Router();

router.get("/stats", verifyFirebaseToken, getLoanStats);
router.post("/", verifyFirebaseToken, validate(createLoanRequest), createLoan);
router.get("/:id", verifyFirebaseToken, getLoanById);
router.get("/", verifyFirebaseToken, getAllLoans);
router.put("/:id/status", verifyFirebaseToken, validate(updateLoanStatus), updateLoanById);
router.get("/:id/emi-schedules", verifyFirebaseToken, getAllLoanEmiSchedules);
router.post("/:id/disburse", verifyFirebaseToken, disburseLoanById);


export default router;