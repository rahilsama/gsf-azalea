import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { prisma } from '../../prisma/client';
import { env } from '../../config/env';

const SALT_ROUNDS = 10;

export const createUser = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const error = new Error('User with this email already exists') as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password as string, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
    },
  });

  return user;
};

export const authenticateUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    const error = new Error('Invalid email or password') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    const error = new Error('Invalid email or password') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    // Cast because jsonwebtoken's typings expect a more specific StringValue type
    expiresIn: env.jwtExpiresIn as unknown as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, env.jwtSecret, options);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
};

