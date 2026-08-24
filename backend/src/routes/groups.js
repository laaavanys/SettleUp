const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function isMember(groupId, userId) {
  return !!db
    .prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?')
    .get(groupId, userId);
}

// Create a group (creator is automatically the first member)
router.post('/', (req, res) => {
  const schema = z.object({ name: z.string().min(1, 'Group name is required') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { name } = parsed.data;
  const result = db
    .prepare('INSERT INTO groups (name, created_by) VALUES (?, ?)')
    .run(name, req.userId);

  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(
    result.lastInsertRowid,
    req.userId
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    created_by: req.userId,
  });
});

// List all groups the current user belongs to
router.get('/', (req, res) => {
  const groups = db
    .prepare(
      `SELECT g.id, g.name, g.created_at,
              (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`
    )
    .all(req.userId);
  res.json(groups);
});

// Get a single group with its members
router.get('/:id', (req, res) => {
  const groupId = Number(req.params.id);
  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = ?`
    )
    .all(groupId);

  res.json({ ...group, members });
});

// Add a member to a group by email
router.post('/:id/members', (req, res) => {
  const groupId = Number(req.params.id);
  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const schema = z.object({ email: z.string().email('Invalid email') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const email = parsed.data.email.toLowerCase();
  const user = db.prepare('SELECT id, name, email FROM users WHERE LOWER(email) = ?').get(email);
  if (!user) {
    const existingInvite = db
      .prepare('SELECT 1 FROM group_invites WHERE group_id = ? AND email = ?')
      .get(groupId, email);

    if (!existingInvite) {
      db.prepare('INSERT INTO group_invites (group_id, email, invited_by, status) VALUES (?, ?, ?, ?)').run(
        groupId,
        email,
        req.userId,
        'pending'
      );
    }

    return res.status(202).json({
      status: 'invited',
      email,
      message: 'Invite sent. Once they create an account, they will be added automatically.',
    });
  }

  if (isMember(groupId, user.id)) {
    return res.status(409).json({ error: 'This user is already in the group' });
  }

  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(
    groupId,
    user.id
  );

  res.status(201).json({ ...user, status: 'added' });
});

router.get('/:id/invites', (req, res) => {
  const groupId = Number(req.params.id);
  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const invites = db
    .prepare('SELECT id, email, status, created_at FROM group_invites WHERE group_id = ? ORDER BY created_at DESC')
    .all(groupId);

  res.json(invites);
});

module.exports = router;
