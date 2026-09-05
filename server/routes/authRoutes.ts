import { Router, Response } from 'express';
import { db } from '../db';
import { hashPassword, comparePassword, generateToken, authMiddleware, AuthenticatedRequest } from '../auth';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    res.status(400).json({ message: 'Passwords do not match' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    res.status(400).json({ message: 'User with this email already exists' });
    return;
  }

  const newUser = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: normalizedEmail,
    password_hash: hashPassword(password),
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.commit();

  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
  });

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.created_at,
    },
  });
});

// POST /api/auth/login
authRouter.post('/login', (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    res.status(401).json({ message: 'Invalid credentials: user not found' });
    return;
  }

  const isMatch = comparePassword(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ message: 'Invalid credentials: incorrect password' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    },
  });
});

// POST /api/auth/demo-switch (allows instantaneous testing of users like Arun / Kishor / Priya)
authRouter.post('/demo-switch', (req, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    res.status(404).json({ message: 'Demo user not found' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  res.json({
    message: `Switched to ${user.name}`,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/users/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ message: 'User profile not found' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  });
});

// GET /api/users (for member search)
authRouter.get('/users', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const sanitizedUsers = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));
  res.json(sanitizedUsers);
});
