import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import eventRoutes from './routes/events';
import deviceRoutes from './routes/devices';
import simRoutes from './routes/sims';
import sessionRoutes from './routes/sessions';
import adverseEventRoutes from './routes/adverseEvents';
import issueRoutes from './routes/issues';
import reminderRoutes from './routes/reminders';
import dashboardRoutes from './routes/dashboard';
import exportRoutes from './routes/export';
import syncRoutes from './routes/sync';
import exerciseRoutes from './routes/exercises';

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sims', simRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/adverse-events', adverseEventRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/exercises', exerciseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
