const express = require('express');
const { queryAll, queryOne, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Health & Medical', 'Utilities', 'Housing', 'Education',
  'Travel', 'Personal Care', 'Gifts & Donations', 'Other'
];

// GET /api/expenses/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';

  const todayRow = await queryOne(
    'SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id=$1 AND date=$2',
    [userId, today]
  );
  const monthRow = await queryOne(
    'SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id=$1 AND date>=$2',
    [userId, monthStart]
  );
  const recentExpenses = await queryAll(
    'SELECT * FROM expenses WHERE user_id=$1 ORDER BY date DESC, created_at DESC LIMIT 8',
    [userId]
  );
  const categoryBreakdown = await queryAll(
    `SELECT category, SUM(amount) AS total, COUNT(*) AS count
     FROM expenses WHERE user_id=$1 AND date>=$2
     GROUP BY category ORDER BY total DESC`,
    [userId, monthStart]
  );

  res.json({
    todayTotal: parseFloat(todayRow?.total || 0),
    monthTotal: parseFloat(monthRow?.total || 0),
    recentExpenses,
    categoryBreakdown: categoryBreakdown.map(c => ({ ...c, total: parseFloat(c.total) }))
  });
});

// GET /api/expenses
router.get('/', authenticateToken, async (req, res) => {
  const { start_date, end_date, period } = req.query;
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0];

  let sql = 'SELECT * FROM expenses WHERE user_id=$1';
  const params = [userId];

  if (period === 'today') {
    sql += ` AND date=$${params.push(today)}`;
  } else if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    sql += ` AND date>=$${params.push(weekAgo)}`;
  } else if (period === 'month') {
    const monthStart = today.slice(0, 7) + '-01';
    sql += ` AND date>=$${params.push(monthStart)}`;
  } else if (start_date && end_date) {
    sql += ` AND date>=$${params.push(start_date)} AND date<=$${params.push(end_date)}`;
  } else if (start_date) {
    sql += ` AND date>=$${params.push(start_date)}`;
  }

  sql += ' ORDER BY date DESC, created_at DESC';

  const expenses = await queryAll(sql, params);
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  res.json({ expenses, total, count: expenses.length });
});

// POST /api/expenses
router.post('/', authenticateToken, async (req, res) => {
  const { amount, category, date, description } = req.body;
  if (!amount || !category || !date)
    return res.status(400).json({ error: 'Amount, category, and date are required' });

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0)
    return res.status(400).json({ error: 'Amount must be a positive number' });
  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: 'Invalid category' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });

  const result = await run(
    'INSERT INTO expenses (user_id, amount, category, date, description) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [req.user.userId, parsedAmount, category, date, description || '']
  );
  const expense = await queryOne('SELECT * FROM expenses WHERE id=$1', [result.lastInsertRowid]);
  res.status(201).json({ expense });
});

// PUT /api/expenses/:id
router.put('/:id', authenticateToken, async (req, res) => {
  const { amount, category, date, description } = req.body;
  const { id } = req.params;

  const existing = await queryOne('SELECT * FROM expenses WHERE id=$1 AND user_id=$2', [id, req.user.userId]);
  if (!existing) return res.status(404).json({ error: 'Expense not found' });

  const parsedAmount = parseFloat(amount ?? existing.amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0)
    return res.status(400).json({ error: 'Amount must be a positive number' });

  const updatedCategory = category || existing.category;
  if (!VALID_CATEGORIES.includes(updatedCategory))
    return res.status(400).json({ error: 'Invalid category' });

  await run(
    'UPDATE expenses SET amount=$1, category=$2, date=$3, description=$4 WHERE id=$5 AND user_id=$6',
    [parsedAmount, updatedCategory, date || existing.date, description ?? existing.description, id, req.user.userId]
  );
  const updated = await queryOne('SELECT * FROM expenses WHERE id=$1', [id]);
  res.json({ expense: updated });
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  const result = await run(
    'DELETE FROM expenses WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.userId]
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json({ message: 'Expense deleted successfully' });
});

module.exports = router;
