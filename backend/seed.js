// seed.js — populates the database with sample data for testing
// Run with: node seed.js (from the backend/ directory)
// WARNING: This will DELETE all existing data first.

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Health & Medical', 'Utilities', 'Housing', 'Education',
  'Travel', 'Personal Care', 'Gifts & Donations', 'Other'
];

function randomBetween(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const SAMPLE_DESCRIPTIONS = {
  'Food & Dining':    ['Lunch at restaurant', 'Grocery shopping', 'Coffee & snacks', 'Dinner with family', 'Swiggy order'],
  'Transportation':   ['Uber ride', 'Auto rickshaw', 'Petrol fill-up', 'Metro card recharge', 'Cab to airport'],
  'Shopping':         ['Clothes shopping', 'Amazon order', 'Electronics', 'Home essentials', 'Flipkart purchase'],
  'Entertainment':    ['Movie tickets', 'Netflix subscription', 'Gaming', 'Concert tickets', 'Spotify premium'],
  'Health & Medical': ['Pharmacy', 'Doctor visit', 'Gym membership', 'Health checkup', 'Vitamins'],
  'Utilities':        ['Electricity bill', 'Water bill', 'Internet bill', 'Gas cylinder', 'Phone recharge'],
  'Housing':          ['Rent', 'Maintenance fee', 'House cleaning', 'Plumber charges', 'Furniture'],
  'Education':        ['Course subscription', 'Books', 'Udemy course', 'Tuition fees', 'Stationery'],
  'Travel':           ['Flight tickets', 'Hotel booking', 'Train tickets', 'Travel insurance', 'Luggage'],
  'Personal Care':    ['Haircut', 'Salon visit', 'Skincare products', 'Toiletries', 'Laundry'],
  'Gifts & Donations':['Birthday gift', 'Wedding gift', 'Charity donation', 'Festival shopping'],
  'Other':            ['Miscellaneous', 'Bank charges', 'ATM withdrawal', 'Subscription renewal'],
};

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await pool.query('DELETE FROM expenses');
  await pool.query('DELETE FROM users');
  await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE expenses_id_seq RESTART WITH 1');
  console.log('Cleared existing data.');

  // Create test user
  const hash = await bcrypt.hash('password123', 12);
  const userResult = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Test User', 'test@example.com', hash]
  );
  const userId = userResult.rows[0].id;
  console.log(`Created user: test@example.com / password123 (id: ${userId})`);

  // Generate 60 days of expenses
  const expenses = [];
  for (let day = 0; day < 60; day++) {
    // 1-4 expenses per day
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const descriptions = SAMPLE_DESCRIPTIONS[category];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];

      // Realistic amounts per category
      const amountRanges = {
        'Housing': [8000, 15000], 'Travel': [500, 8000],
        'Education': [200, 3000], 'Health & Medical': [100, 2000],
        'Shopping': [200, 3000], 'Entertainment': [100, 1500],
        'Utilities': [200, 2000], 'Food & Dining': [50, 800],
        'Transportation': [20, 500], 'Personal Care': [50, 500],
        'Gifts & Donations': [200, 2000], 'Other': [50, 500],
      };
      const [min, max] = amountRanges[category] || [50, 500];

      expenses.push({
        user_id: userId,
        amount: randomBetween(min, max),
        category,
        date: daysAgo(day),
        description,
      });
    }
  }

  // Bulk insert
  for (const e of expenses) {
    await pool.query(
      'INSERT INTO expenses (user_id, amount, category, date, description) VALUES ($1,$2,$3,$4,$5)',
      [e.user_id, e.amount, e.category, e.date, e.description]
    );
  }

  console.log(`Created ${expenses.length} expenses over 60 days.`);
  console.log('\n✅ Seed complete!\n');
  console.log('Login with:');
  console.log('  Email:    test@example.com');
  console.log('  Password: password123\n');

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
