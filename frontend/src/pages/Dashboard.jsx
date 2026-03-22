import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Dashboard.css';

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

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <p style={{ fontWeight: 600 }}>{payload[0].name}</p>
        <p style={{ color: payload[0].payload.fill }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/expenses/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pieData = data?.categoryBreakdown?.map(c => ({
    name: c.category,
    value: c.total,
    fill: CATEGORY_COLORS[c.category] || '#94a3b8',
  })) || [];

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="dashboard page-enter">
      <div className="dash-header">
        <div>
          <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dash-subtitle">Here's your spending overview</p>
        </div>
        <Link to="/expenses" className="btn btn-primary">
          + Add Expense
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Spending</div>
          <div className="stat-value">{formatCurrency(data?.todayTotal || 0)}</div>
          <div className="stat-sub">
            {data?.recentExpenses?.filter(e => e.date === new Date().toISOString().split('T')[0]).length || 0} transactions today
          </div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatCurrency(data?.monthTotal || 0)}</div>
          <div className="stat-sub">
            {data?.categoryBreakdown?.length || 0} categories used
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Category</div>
          <div className="stat-value stat-value--sm">
            {data?.categoryBreakdown?.[0]?.category || '—'}
          </div>
          <div className="stat-sub">
            {data?.categoryBreakdown?.[0] ? formatCurrency(data.categoryBreakdown[0].total) : 'No data yet'}
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Recent Expenses */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Expenses</h2>
            <Link to="/expenses" className="card-link">View all →</Link>
          </div>
          {data?.recentExpenses?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No expenses yet.</p>
              <Link to="/expenses" className="btn btn-primary btn-sm">Add your first</Link>
            </div>
          ) : (
            <div className="expense-list">
              {data?.recentExpenses?.map(exp => (
                <div key={exp.id} className="expense-row">
                  <div className="exp-dot" style={{ background: CATEGORY_COLORS[exp.category] || '#94a3b8' }} />
                  <div className="exp-info">
                    <span className="exp-desc">{exp.description || exp.category}</span>
                    <span className="exp-meta">{exp.category} · {formatDate(exp.date)}</span>
                  </div>
                  <span className="exp-amount">{formatCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h2>Spending by Category</h2>
            <span className="card-sub">This month</span>
          </div>
          {pieData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🥧</div>
              <p>Add expenses to see breakdown</p>
            </div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
