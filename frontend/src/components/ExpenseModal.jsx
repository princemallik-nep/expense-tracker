import React, { useState, useEffect } from 'react';
import './ExpenseModal.css';

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Health & Medical', 'Utilities', 'Housing', 'Education',
  'Travel', 'Personal Care', 'Gifts & Donations', 'Other'
];

const today = () => new Date().toISOString().split('T')[0];

export default function ExpenseModal({ expense, onSave, onClose }) {
  const isEdit = !!expense;
  const [form, setForm] = useState({
    amount: expense?.amount || '',
    category: expense?.category || CATEGORIES[0],
    date: expense?.date || today(),
    description: expense?.description || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, amount });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal page-enter">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={form.amount}
                onChange={set('amount')}
                step="0.01"
                min="0.01"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={set('date')}
                max={today()}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input" value={form.category} onChange={set('category')} required>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="What was this for?"
              value={form.description}
              onChange={set('description')}
              maxLength={200}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : (isEdit ? 'Save Changes' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
