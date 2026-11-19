import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const JWT_SECRET = env.JWT_SECRET;

export type AuthUser = { id: string; name: string; email: string };
export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string };
export type AuthResponse = { user: AuthUser; token: string };

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const createToken = (user: AuthUser) => jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (name.length < 2) throw new Error('Name must contain at least 2 characters.');
  if (!email.includes('@')) throw new Error('Please enter a valid email address.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('An account with that email already exists.');

  const created = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  const user = { id: created.id, name: created.name, email: created.email };
  return { user, token: createToken(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const email = normalizeEmail(input.email);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser || !(await bcrypt.compare(input.password, existingUser.passwordHash))) {
    throw new Error('Invalid email or password.');
  }

  const user = { id: existingUser.id, name: existingUser.name, email: existingUser.email };
  return { user, token: createToken(user) };
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<AuthUser>;
    return decoded.id && decoded.email && decoded.name
      ? { id: decoded.id, name: decoded.name, email: decoded.email }
      : null;
  } catch {
    return null;
  }
}
