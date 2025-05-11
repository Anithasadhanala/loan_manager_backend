import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const hasAdminPermission = async (role: string): Promise<boolean> => {
  return role ==('Admin') || role == ('SuperAdmin');
};
