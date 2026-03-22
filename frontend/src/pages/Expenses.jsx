import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import ExpenseModal from '../components/ExpenseModal';
import './Expenses.css';

const CATEGORY_COLORS = {
  'Food & Dining':    '#7c6af7',
  'Transportation':   '#4ade80',
  'Shopping':         '#fbbf24',
  'Entertainment':    '#f87171',
  'Health & Medical': '#38bdf8',
  'Utilities':        '#a78bfa',
  'Housing':          '#34d399',
  'Education':        '#fb923c',
  'Travel':           '#e879f9',
  'Personal Care':    '#67e8f9',
  'Gifts & Donations':'#f9a8d4',
  'Other':            '#94a3b8',
};

const PERIODS = [
  { value: 'all',   label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom',label: 'Custom' },
];

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | expense object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let params = {};
      if (period === 'custom') {
        if (customStart) params.start_date = customStart;
        if (customEnd) params.end_date = customEnd;
      } else if (period !== 'all') {
        params.period = period;
      }
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSave = async (formData) => {
    if (modal && modal !== 'add') {
      await api.put(`/expenses/${modal.id}`, formData);
    } else {
      await api.post('/expenses', formData);
    }
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/expenses/${id}`);
      setDeleteConfirm(null);
      fetchExpenses();
    } catch {
      setError('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="expenses-page page-enter">
      <div className="expenses-header">
        <div>
          <h1>Expenses</h1>
          <p className="dash-subtitle">Manage and track your spending</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="period-tabs">
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`period-tab ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="custom-range">
            <input
              type="date"
              className="form-input"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              placeholder="Start date"
            />
            <span className="range-sep">to</span>
            <input
              type="date"
              className="form-input"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              placeholder="End date"
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="summary-bar">
        <span className="summary-count">
          {loading ? '—' : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
        </span>
        <span className="summary-total">
          Total: <strong>{loading ? '—' : formatCurrency(total)}</strong>
        </span>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      <div className="card expenses-table-wrap">
        {loading ? (
          <div className="table-loading"><div className="spinner" /></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <p>No expenses found for this period.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
              Add your first expense
            </button>
          </div>
        ) : (
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td className="col-date">{formatDate(exp.date)}</td>
                  <td>
                    <span className="category-badge" style={{
                      background: `${CATEGORY_COLORS[exp.category] || '#94a3b8'}20`,
                      color: CATEGORY_COLORS[exp.category] || '#94a3b8',
                    }}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="col-desc">{exp.description || <span className="text-dim">—</span>}</td>
                  <td className="col-amount">{formatCurrency(exp.amount)}</td>
                  <td className="col-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setModal(exp)}
                    >Edit</button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirm(exp)}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <ExpenseModal
          expense={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal page-enter" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2>Delete Expense</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              Are you sure you want to delete this {deleteConfirm.category} expense of{' '}
              <strong style={{ color: 'var(--text)' }}>{formatCurrency(deleteConfirm.amount)}</strong>?
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
              >
                {deleting ? <span className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
