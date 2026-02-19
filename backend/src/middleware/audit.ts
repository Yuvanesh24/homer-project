import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from './auth';

export const auditLog = (tableName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function (data: any) {
      if (req.user && ['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
        try {
          prisma.auditLog.create({
            data: {
              userId: req.user.id,
              tableName,
              recordId: data?.id || req.params.id,
              action: req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : 'delete',
              newValues: data,
              ipAddress: req.ip || req.socket?.remoteAddress,
            },
          }).catch(() => {});
        } catch (error) {
          console.error('Audit log error:', error);
        }
      }
      return originalJson(data);
    };
    
    next();
  };
};
