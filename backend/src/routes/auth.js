const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, passwordHash);

  const pendingInvites = db
    .prepare('SELECT group_id, invited_by FROM group_invites WHERE email = ? AND status = ?')
    .all(email.toLowerCase(), 'pending');

  for (const invite of pendingInvites) {
    const alreadyMember = db
      .prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?')
      .get(invite.group_id, result.lastInsertRowid);

    if (!alreadyMember) {
      db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(
        invite.group_id,
        result.lastInsertRowid
      );
    }

    db.prepare('UPDATE group_invites SET status = ? WHERE group_id = ? AND email = ?')
      .run('accepted', invite.group_id, email.toLowerCase());
  }

  const token = signToken(result.lastInsertRowid);
  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, email },
  });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = router;
