import { whoami } from './auth';
import id from './id';
import prisma from './db';

export async function createPost(content: string, token: string) {
  const user = await whoami(token);
  const username = user.username;

  const dbUser = await prisma.user.findUnique({
    where: {
      username
    }
  });

  const post = await prisma.post.create({
    data: {
      id: id(),
      content,
      authorId: dbUser.id
    }
  });

  return {
    content: post.content,
    id: post.id,
    author: dbUser.username
  };
}

export async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id }
  });

  const user = await prisma.user.findUnique({
    where: { id: post.authorId }
  });

  return {
    content: post.content,
    id: post.id,
    by: user.username
  }
}