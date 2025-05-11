import { Router } from "express";
import validate from "../middlewares/validateRequestParams";
import { createUserDetailsRequest } from "../validations/user";
import { createUserDetails, getUserDetails } from "../controllers/user";
import {verifyFirebaseToken} from "../middlewares/validateAuthToken"

const router = Router();

router.post("/:id/details", verifyFirebaseToken, validate(createUserDetailsRequest), createUserDetails);
router.get("/:id/details", verifyFirebaseToken, getUserDetails);

export default router;