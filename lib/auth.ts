// Admin session validation middleware
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN';
  isActive: boolean;
}

export interface ValidatedRequest extends NextRequest {
  admin?: AdminUser;
}

export async function validateAdminSession(request: NextRequest): Promise<{ 
  isValid: boolean; 
  admin?: AdminUser; 
  error?: string;
  redirectUrl?: string;
}> {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return { 
        isValid: false, 
        error: 'No authentication token found',
        redirectUrl: '/login'
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as any;

    // Check if session exists in database
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return { 
        isValid: false, 
        error: 'Session expired or invalid',
        redirectUrl: '/login'
      };
    }

    if (!session.admin?.isActive) {
      return { 
        isValid: false, 
        error: 'Account is deactivated',
        redirectUrl: '/login'
      };
    }

    return {
      isValid: true,
      admin: {
        id: session.admin.id,
        username: session.admin.username,
        email: session.admin.email,
        role: session.admin.role,
        isActive: session.admin.isActive
      }
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { 
      isValid: false, 
      error: 'Invalid session token',
      redirectUrl: '/login'
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function requireAdminSession(request: NextRequest) {
  const validation = await validateAdminSession(request);
  
  if (!validation.isValid) {
    throw new Error(validation.error || 'Authentication required');
  }
  
  return validation.admin!;
}
