import dns from 'node:dns';

import { hashSync } from '@node-rs/bcrypt';
import mongoose from 'mongoose';

import { defaultCategorySeeds } from '../modules/database/seeds/default-categories.seed';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Use system default DNS
}

const run = async () => {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/spendwise';
  await mongoose.connect(mongoUri);

  const categoryCollection = mongoose.connection.collection('categories');
  const now = new Date();

  // Seed Default Categories
  const categoryResult = await categoryCollection.bulkWrite(
    defaultCategorySeeds.map((category) => ({
      updateOne: {
        filter: {
          name: category.name,
          isSystemDefined: true,
        },
        update: {
          $setOnInsert: {
            ...category,
            isSystemDefined: true,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    })),
  );

  if (categoryResult.upsertedCount > 0) {
    console.log(
      `Seeded ${categoryResult.upsertedCount} default categor${categoryResult.upsertedCount === 1 ? 'y' : 'ies'}`,
    );
  } else {
    console.log('Default categories already up to date');
  }

  // Seed Demo User
  const usersCollection = mongoose.connection.collection('users');
  const demoEmail = 'demo@spendwise.com';

  let user = await usersCollection.findOne({ email: demoEmail });

  if (!user) {
    const passwordHash = hashSync('password123', 10);
    const insertResult = await usersCollection.insertOne({
      name: 'Maya Tan',
      email: demoEmail,
      phone: '1234567890',
      currency: 'USD',
      emailVerified: true,
      passwordHash,
      notificationPreferences: {
        budget: true,
        ai: true,
        forecast: true,
        recurring: true,
        goal: true,
        transaction: true,
      },
      createdAt: now,
      updatedAt: now,
    });
    user = { _id: insertResult.insertedId, email: demoEmail };
    console.log('Created demo user: demo@spendwise.com / password123');
  } else {
    console.log('Demo user already exists');
  }

  const userId = user._id.toString();

  // Fetch system categories to link to budgets/expenses
  const systemCategories = await categoryCollection.find({ isSystemDefined: true }).toArray();
  const categoryMap = new Map(systemCategories.map((c) => [c.name, c._id.toString()]));

  // Create some missing categories if they aren't in system categories
  const neededCategories = ['Food', 'Transport', 'Health', 'Shopping', 'Entertainment', 'Bills'];
  for (const catName of neededCategories) {
    if (!categoryMap.has(catName)) {
      const insertRes = await categoryCollection.insertOne({
        userId,
        isSystemDefined: false,
        name: catName,
        icon: 'tag',
        color: '#64748B',
        createdAt: now,
        updatedAt: now,
      });
      categoryMap.set(catName, insertRes.insertedId.toString());
    }
  }

  // Seed Budgets for Demo User
  const budgetsCollection = mongoose.connection.collection('budgets');

  // Clear existing demo budgets
  await budgetsCollection.deleteMany({ userId });

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const demoBudgets = [
    { name: 'Food', limitAmount: 900 },
    { name: 'Transport', limitAmount: 520 },
    { name: 'Shopping', limitAmount: 600 },
    { name: 'Bills', limitAmount: 2300 },
  ];

  await budgetsCollection.insertMany(
    demoBudgets.map((b) => ({
      userId,
      categoryId: categoryMap.get(b.name) ?? categoryMap.values().next().value,
      limitAmount: b.limitAmount,
      month: currentMonth,
      year: currentYear,
      createdAt: now,
      updatedAt: now,
    })),
  );
  console.log('Seeded demo budgets');

  // Seed Expenses for Demo User
  const expensesCollection = mongoose.connection.collection('expenses');

  // Clear existing demo expenses
  await expensesCollection.deleteMany({ userId });

  const demoExpenses = [
    {
      merchant: 'Willow Market',
      category: 'Food',
      amount: 124.8,
      paymentMethod: 'credit_card',
      note: 'Weekly groceries',
    },
    {
      merchant: 'Metro Transit',
      category: 'Transport',
      amount: 18.5,
      paymentMethod: 'e_wallet',
      note: 'Morning commute',
    },
    {
      merchant: 'Nimbus Gym',
      category: 'Health',
      amount: 48,
      paymentMethod: 'debit_card',
      note: 'Monthly membership',
    },
    {
      merchant: 'Northshore Cafe',
      category: 'Food',
      amount: 26.9,
      paymentMethod: 'credit_card',
      note: 'Lunch meeting',
    },
    {
      merchant: 'Studio Ledger',
      category: 'Shopping',
      amount: 268,
      paymentMethod: 'credit_card',
      note: 'Desk accessories',
    },
    {
      merchant: 'Streamly',
      category: 'Entertainment',
      amount: 14.99,
      paymentMethod: 'debit_card',
      note: 'Subscription renewal',
    },
  ];

  const generatedExpenses = [];
  // 6 months is roughly 180 days
  for (let i = 0; i < 180; i++) {
    const expenseDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Add 1 to 3 expenses per day
    const numExpenses = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numExpenses; j++) {
      const template = demoExpenses[Math.floor(Math.random() * demoExpenses.length)]!;
      // Randomize amount by +/- 20%
      const amountVariation = 0.8 + Math.random() * 0.4;
      generatedExpenses.push({
        userId,
        amount: Number((template.amount * amountVariation).toFixed(2)),
        categoryId: categoryMap.get(template.category) ?? categoryMap.values().next().value,
        description: template.merchant,
        paymentMethod: template.paymentMethod,
        date: expenseDate,
        notes: template.note,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await expensesCollection.insertMany(generatedExpenses);
  console.log('Seeded demo expenses');

  // Seed Goals for Demo User
  const goalsCollection = mongoose.connection.collection('goals');
  await goalsCollection.deleteMany({ userId });

  const targetDate6Mo = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const targetDate4Mo = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
  const targetDatePast = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  const demoGoals = [
    {
      userId,
      title: 'Emergency Fund',
      targetAmount: 5000,
      currentAmount: 2400,
      targetDate: targetDate6Mo,
      notes: 'Three-month living expense buffer',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      title: 'Japan Vacation',
      targetAmount: 3000,
      currentAmount: 1200,
      targetDate: targetDate4Mo,
      notes: 'Autumn trip to Tokyo and Kyoto',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      title: 'Laptop Upgrade',
      targetAmount: 1500,
      currentAmount: 1500,
      targetDate: targetDatePast,
      notes: 'New M-series workstation for remote work',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      title: 'Holiday Shopping Fund',
      targetAmount: 2000,
      currentAmount: 850,
      targetDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      notes: 'Gifts and holiday season travel',
      createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
  ];

  await goalsCollection.insertMany(demoGoals);
  console.log('Seeded demo goals');

  // Seed Default Prompt Templates
  const { DEFAULT_PROMPT_TEMPLATES } = await import('@spendwise/ai');
  const promptCollection = mongoose.connection.collection('prompt_templates');

  for (const template of DEFAULT_PROMPT_TEMPLATES) {
    await promptCollection.updateOne(
      { type: template.type },
      {
        $set: {
          type: template.type,
          version: template.version,
          template: template.template,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }
  console.log('Seeded default prompt templates');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
