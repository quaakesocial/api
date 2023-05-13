import express from 'express';
import dotenv from 'dotenv';
import { register, login, whoami } from './utils/auth';
import { createPost, getPost } from './utils/post';
import prisma from './utils/db';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ name: 'quake-api', by: 'errplane' });
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  let data: { token: string };
  try {
    data = await register({ username, email, password });
    res.json({ ...data });
  } catch(err) {
    res.status(400).json({ msg: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let data: { token: string };
  try {
    data = await login({ username, password });
    res.json({ ...data });
  } catch(err) {
    res.status(400).json({ msg: err.message });
  }
});

app.get('/whoami', async (req, res) => {
  const token = req.headers.authorization;

  if(!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    const userInfo = await whoami(token);
    res.json(userInfo);
  } catch(err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/createPost', async (req, res) => {
  const { content } = req.body;
  const token = req.headers.authorization;

  try {
    const post = await createPost(content, token);
    res.json(post);
  } catch(err) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/p/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const post = await getPost(id);
    res.json(post);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/u/:user', async (req, res) => {
  const { user: username } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { username }
    });

    const posts = await prisma.post.findMany({
      where: { author: user }
    });

    let parsedPosts: {}[] = [];
    const keys = Object.keys(posts);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      parsedPosts.push(await getPost(posts[key].id));
    }
    res.json({ username: user.username, id: user.id, joinDate: user.joinDate, posts: parsedPosts });
  } catch(err) {
    console.log(err);
    res.status(500).json({ msg: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`listening on *:${port}`);
});
