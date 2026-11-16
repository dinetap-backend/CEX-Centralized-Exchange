import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

const users = new Map<string, UserRecord>();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createToken = (user: AuthUser) =>
  jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!name || name.length < 2) {
    throw new Error('Name must contain at least 2 characters.');
  }

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (users.has(email)) {
    throw new Error('An account with that email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: UserRecord = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
  };

  users.set(email, user);

  const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };

  return {
    user: authUser,
    token: createToken(authUser),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  const existingUser = users.get(email);

  if (!existingUser) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const authUser: AuthUser = {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
  };

  return {
    user: authUser,
    token: createToken(authUser),
  };
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<AuthUser> & { id?: string; name?: string; email?: string };

    if (!decoded.id || !decoded.email || !decoded.name) {
      return null;
    }

    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}
