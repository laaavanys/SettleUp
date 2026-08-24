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

const expenseSchema = z.object({
  groupId: z.number().int(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  paidBy: z.number().int(),
  category: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'weekly', 'yearly']).optional(),
  recurringStart: z.string().optional(),
  // Optional custom split: [{ userId, shareAmount }]. If omitted, splits
  // equally among all current group members.
  splits: z
    .array(z.object({ userId: z.number().int(), shareAmount: z.number().nonnegative() }))
    .optional(),
});

// Add a new expense
router.post('/', (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { groupId, description, amount, paidBy, category, recurring, recurringInterval, recurringStart, splits } = parsed.data;

  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }
  if (!isMember(groupId, paidBy)) {
    return res.status(400).json({ error: 'The payer must be a member of this group' });
  }

  let finalSplits = splits;
  if (!finalSplits) {
    const members = db
      .prepare('SELECT user_id FROM group_members WHERE group_id = ?')
      .all(groupId);
    const equalShare = Math.round((amount / members.length) * 100) / 100;
    // Give any rounding remainder to the first member so shares always sum to `amount`
    finalSplits = members.map((m, idx) => ({
      userId: m.user_id,
      shareAmount: idx === 0 ? amount - equalShare * (members.length - 1) : equalShare,
    }));
  } else {
    const sum = finalSplits.reduce((s, x) => s + x.shareAmount, 0);
    if (Math.abs(sum - amount) > 0.02) {
      return res.status(400).json({ error: 'Split amounts must add up to the total amount' });
    }
  }

  const insertExpense = db.prepare(
    `INSERT INTO expenses (group_id, description, amount, paid_by, created_by, category, recurring, recurring_interval, recurring_start)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertShare = db.prepare(
    'INSERT INTO expense_shares (expense_id, user_id, share_amount) VALUES (?, ?, ?)'
  );

  const tx = db.transaction(() => {
    const result = insertExpense.run(
      groupId,
      description,
      amount,
      paidBy,
      req.userId,
      category || 'general',
      recurring ? 1 : 0,
      recurring ? (recurringInterval || 'monthly') : 'monthly',
      recurringStart || new Date().toISOString().slice(0, 10)
    );
    for (const s of finalSplits) {
      insertShare.run(result.lastInsertRowid, s.userId, s.shareAmount);
    }
    return result.lastInsertRowid;
  });

  const expenseId = tx();
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
  const shares = db
    .prepare('SELECT user_id, share_amount FROM expense_shares WHERE expense_id = ?')
    .all(expenseId);

  res.status(201).json({ ...expense, shares });
});

// List expenses for a group
router.get('/group/:groupId', (req, res) => {
  const groupId = Number(req.params.groupId);
  if (!isMember(groupId, req.userId)) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const expenses = db
    .prepare(
      `SELECT e.*, u.name as paid_by_name
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = ?
       ORDER BY e.created_at DESC`
    )
    .all(groupId);

  const shareStmt = db.prepare(
    `SELECT es.user_id, u.name, es.share_amount
     FROM expense_shares es JOIN users u ON u.id = es.user_id
     WHERE es.expense_id = ?`
  );

  const withShares = expenses.map((e) => ({ ...e, shares: shareStmt.all(e.id) }));
  res.json(withShares);
});

// Delete an expense (only the person who created it can delete it)
router.delete('/:id', (req, res) => {
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (expense.created_by !== req.userId) {
    return res.status(403).json({ error: 'Only the person who added this expense can delete it' });
  }
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
