import prisma from './db';
import id from './id';
import { whoami } from './auth';

export async function createComment(postId: string, content: string, token: string) {
  const user = await whoami(token);

  const username = user.username;

  const dbUser = await prisma.user.findUnique({
    where: {
      username
    }
  });

  const comment = await prisma.comment.create({
    data: {
      id: id(),
      content,
      authorId: dbUser.id
    }
  });
}