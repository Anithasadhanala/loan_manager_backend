// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import firebaseAdmin from '../config/firebase';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return; 
  }
  try {
    const decodedObj = await firebaseAdmin.auth().verifyIdToken(token);
    const oauthId = decodedObj.uid;

    const user = await prisma.users.findUnique({
      where: { oauth_id: oauthId },
      include: { user_roles: true },
    });

    if (user) {
      const role = user.user_roles?.role || null;
      req.user = { user_id: user.id, name: user.name, role: role};
    }else{
      req.user = decodedObj
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token or session expired' });
    return;
  }
};
