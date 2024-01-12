import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from './db';
import id from './id';

export async function register(data: { username: string, email: string, password: string }): Promise<{ token: string; }> {
  if(!data.email || !data.password || !data.username) {
    throw new Error('Not enough details.');
  }

  if(!/\S+@\S+\.\S+$/.test(data.email)) {
    throw new Error('Invalid email.');
  }

  if(/[^a-z0-9_-]/.test(data.username)) {
    throw new Error('Invalid username.');
  }

  const existingUser = await prisma.user.findFirst({
    where: { username: data.username, email: data.email }
  });

  if(existingUser) {
    throw new Error('User already exists.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      id: id(),
      email: data.email,
      username: data.username,
      password: hashedPassword
    }
  });
  
  const token = jwt.sign({ id: user.id }, process.env.SECRET!, { expiresIn: '7 days' });
  
  return { token };
}


export async function login(data: { username: string, password: string }): Promise<{ token: string; }> {
  if(!data.username || !data.password) {
    throw new Error('Not enough details.');
  }

  const user = await prisma.user.findUnique({
    where: {
      username: data.username
    }
  });

  if(!user) {
    throw new Error('Invalid details.');
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password);

  if(!passwordMatches) {
    throw new Error('Invalid details.');
  }

  const token = jwt.sign({ id: user.id }, process.env.SECRET!, { expiresIn: '7 days' });

  return { token };
}


export async function whoami(token: string): Promise<{ id: string, email: string, username: string, banned: boolean, admin: boolean }> {
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET!) as { id: string };
    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken.id
      },
      select: {
        id: true,
        email: true,
        username: true,
        admin: true,
        banned: true
      }
    });

    if(!user) {
      throw new Error('User not found.');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      admin: user.admin,
      banned: user.banned
    };
  } catch (error) {
    throw new Error('Invalid token.');
  }
}
