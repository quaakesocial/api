import express from 'express';
import dotenv from 'dotenv';
import { register, login, whoami } from './utils/auth';
import { createPost, getPost, lovePost, unlovePost, reportPost, getPosts } from './utils/post';
import { createComment } from './utils/comment';
import prisma from './utils/db';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ name: 'quaake-api', by: 'errplane', cool: 'yes' });
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

app.post('/p/:id/love', async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization;

  try {
    await lovePost(id, token);
    res.json(await getPost(id));
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/p/:id/love', async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization;

  try {
    await unlovePost(id, token);
    res.json(await getPost(id))
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/p/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const token = req.headers.authorization;

  try {
    await createComment(id, content, token);
    res.json(await getPost(id));
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/p/:id/report', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if((await getPost(id)).reported == true) {
    res.status(409).json({ error: 'already reported' })
  } else {
    try {
      await reportPost(id, reason);
      res.json(await getPost(id))
    } catch(err) {
      res.status(500).json({ error: err.message })
    }
  }
})

app.get('/getReportedPosts', async (req, res) => {
  try {
    if((await whoami(req.body.token)).admin == true) {
      res.json(await getPosts());
    } else {
      res.json({ "msg": "lol ur not admin you noob" });
    }
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/u/:user', async (req, res) => {
  const { user: username } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { username }
    });

    const posts = await prisma.post.findMany({
      where: { author: user },
      orderBy: { createDate: 'desc' }
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
