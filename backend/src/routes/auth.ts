import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { loginSchema, registerSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

router.get('/test-users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json({ count: users.length, users: users.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })) });
});

router.get('/reset-password', async (req, res) => {
  const { email, newPassword } = req.query;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Missing email or newPassword' });
  }
  const passwordHash = await bcrypt.hash(newPassword as string, 12);
  await prisma.user.update({
    where: { email: email as string },
    data: { passwordHash },
  });
  res.json({ success: true, message: 'Password updated for ' + email });
});

router.get('/setup-users', async (req, res) => {
  // Create default users
  const users = [
    { email: 'yuvanesh@homer.org', password: 'Yuvan@123', firstName: 'Yuvanesh', lastName: '', role: 'admin' as const },
    { email: 'nidhi@homer.org', password: 'Nidhi@123', firstName: 'Nidhi', lastName: 'Mislankar', role: 'therapist' as const },
  ];
  
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: true,
      },
    });
  }
  res.json({ success: true, message: 'Users created/updated' });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials - user not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User is inactive' });
    }

    // Debug: just check if password matches
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials - wrong password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
