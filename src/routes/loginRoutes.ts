import { Router } from "express";
import validate from "../middlewares/validateRequestParams";
import { createUserRequest } from "../validations/user";
import { createUser } from "../controllers/user";
import {verifyFirebaseToken} from "../middlewares/validateAuthToken"

const router = Router();

router.post("/", verifyFirebaseToken, validate(createUserRequest), createUser);

export default router;