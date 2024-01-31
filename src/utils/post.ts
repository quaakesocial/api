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
    loves: JSON.parse(post.loves),
    createDate: post.createDate,
    by: user.username,
    reported: post.reported,
    comments: post
  }
}

export async function lovePost(id: string, token: string) {
  const user = await whoami(token);

  const post = await prisma.post.findUnique({
    where: {
      id
    }
  });

  const loves = JSON.parse(post.loves);
  loves.push(user.id);
  await prisma.post.update({
    where: { id },
    data: {
      loves: JSON.stringify(loves)
    }
  });
}

export async function unlovePost(id: string, token: string) {
  const user = await whoami(token);

  const post = await prisma.post.findUnique({
    where: {
      id
    }
  });

  const loves = JSON.parse(post.loves);
  loves.splice(loves.indexOf(user.id), 1)
  await prisma.post.update({
    where: { id },
    data: {
      loves: JSON.stringify(loves)
    }
  });
}

export async function reportPost(id: string, reason: string) {
  const a = reason || "no reason provided 🍕";
  await prisma.post.update({
    where: { id },
    data: {
      reported: true,
      reason
    }
  })
}

export async function getPosts() {
  const posts = await prisma.post.findMany({ where: { reported: true } });
  return posts;
}