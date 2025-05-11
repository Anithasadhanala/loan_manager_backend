import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {pickFields} from "../utils/pickFields";

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response):Promise<any> => {
  try {

    const oauthId = req.user?.uid;
    const oauthProvider = req.user?.firebase?.sign_in_provider;
    const name = req.user?.name;
    const email = req.user?.email;
    const type = req.body?.type;
    const userId = req.user?.user_id;

    let user;

    if (oauthId) {
      user = await prisma.users.findUnique({
        where: { oauth_id: oauthId },
        include: { user_roles: true }, // Include related roles
      });
    } else {
      user = await prisma.users.findUnique({
        where: { id: userId },
        include: { user_roles: true },
      });
    }
    
    if (user) {
      const selectedUserFieldsExisting = pickFields('users', user);
      const role = user.user_roles ? user.user_roles.role : null; // user_roles is not an array in one-to-one
    
      return res.status(200).json({
        message: "User already exists",
        data: {
          ...selectedUserFieldsExisting,
          role,
        },
      });
    }
    
    const newUser = await prisma.users.create({
      data: { name, email, oauth_id: oauthId, oauth_provider: oauthProvider, type, active: true,},
    });
    const userRole = await prisma.user_roles.create({
        data: {
          user_id: newUser.id,
          role: "Borrower",
        },
      });
      const selectedUserFields = pickFields('users', newUser);

     return res.status(201).json({
      message: "User created successfully",
      data: { ...selectedUserFields, role: userRole.role },
    });
  } catch (error: any) {    
    return res.status(500).json({
      message: "Error creating user",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};



export const createUserDetails = async (req: Request, res: Response): Promise<any> => {
    try {

        const userId = parseInt(req.params.id);
        const { bank_name, account_number, ifsc_code, bank_branch, upi } = req.body;

        const userExists = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }
        const userDetails = await prisma.user_details.create({
            data: { user_id: userId, bank_name, account_number, ifsc_code, bank_branch, upi,},
        });

        return res.status(201).json({
            message: "User details created successfully",
            data: userDetails,
        });
    } catch (error) {
      return res.status(409).json({ message: "User details already exist for this user_id" });
    }
};




export const getUserDetails = async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = parseInt(req.params.id);
      const userExists = await prisma.users.findUnique({
        where: { id: userId },
      });
  
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const userDetails = await prisma.user_details.findUnique({
        where: { user_id: userId },
      });
  
      return res.status(200).json({
        message: "User details fetched successfully",
        data: userDetails,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Error fetching user details",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };