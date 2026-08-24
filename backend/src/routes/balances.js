const express = require('express');
const { z } = require('zod');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { simplifyDebts } = require('../utils/simplifyDebts');

const router = express.Router();
router.use(requireAuth);

function isMember(groupId, userId) {
  return !!db
    .prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?')
    .get(groupId, userId);
}

/**
 * Net balance per user = (total they paid across all expenses)
 *                       - (total of their shares across all expenses)
 *                       + (settlements they sent)   [reduces what they owe]
 *                       - (settlements they received) [reduces what they're owed]
 */
function computeNetBalances(groupId) {
  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = ?`
    )
    .all(groupId);

  const net = {};
  for (const m of members) net[m.id] = 0;

  const paidRows = db
    .prepare(`SELECT paid_by as userId, SUM(amount) as total FROM expenses WHERE group_id = ? GROUP BY paid_by`)
    .all(groupId);
  for (const row of paidRows) net[row.userId] = (net[row.userId] || 0) + row.total;

  const shareRows = db
    .prepare(
      `SELECT es.user_id as userId, SUM(es.share_amount) as total
       FROM expense_shares es JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = ? GROUP BY es.user_id`
    )
    .all(groupId);
  for (const row of shareRows) net[row.userId] = (net[row.userId] || 0) - row.total;

  const settlementRows = db
    .prepare('SELECT from_user, to_user, amount FROM settlements WHERE group_id = ?')
    .all(groupId);
  for (const s of settlementRows) {
    net[s.from_user] = (net[s.from_user] || 0) + s.amount;
    net[s.to_user] = (net[s.to_user] || 0) - s.amount;
  }

  // Round to avoid floating point dust
  for (const id of Object.keys(net)) {
    net[id] = Math.round(net[id] * 100) / 100;
  }

  return { members, net };
}

// GET /api/balances/:groupId -> net balance per member + simplified settle-up plan
router.get('/:groupId', (req, res) => {
  const groupId = Number(req.params.groupId);
  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const { members, net } = computeNetBalances(groupId);
  const nameById = Object.fromEntries(members.map((m) => [m.id, m.name]));

  const balances = members.map((m) => ({
    userId: m.id,
    name: m.name,
    netBalance: net[m.id] || 0,
  }));

  const rawTransactionCount = balances.filter((b) => Math.abs(b.netBalance) > 0.01).length;

  const settleUpPlan = simplifyDebts(net).map((t) => ({
    ...t,
    fromName: nameById[t.from],
    toName: nameById[t.to],
  }));

  res.json({
    balances,
    settleUpPlan,
    stats: {
      transactionsWithoutSimplification: rawTransactionCount,
      transactionsWithSimplification: settleUpPlan.length,
    },
  });
});

// POST /api/balances/:groupId/settle -> record that a payment was made
router.post('/:groupId/settle', (req, res) => {
  const groupId = Number(req.params.groupId);
  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const schema = z.object({
    from: z.number().int(),
    to: z.number().int(),
    amount: z.number().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { from, to, amount } = parsed.data;

  if (!isMember(groupId, from) || !isMember(groupId, to)) {
    return res.status(400).json({ error: 'Both users must be members of this group' });
  }

  db.prepare(
    'INSERT INTO settlements (group_id, from_user, to_user, amount) VALUES (?, ?, ?, ?)'
  ).run(groupId, from, to, amount);

  res.status(201).json({ message: 'Settlement recorded' });
});

module.exports = router;
