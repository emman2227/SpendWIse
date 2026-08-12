import { hashSync } from '@node-rs/bcrypt';
import mongoose from 'mongoose';

import { defaultCategorySeeds } from '../modules/database/seeds/default-categories.seed';

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

  // Distribute over the last couple of days
  await expensesCollection.insertMany(
    demoExpenses.map((e, index) => {
      const expenseDate = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
      return {
        userId,
        amount: e.amount,
        categoryId: categoryMap.get(e.category) ?? categoryMap.values().next().value,
        description: e.merchant,
        paymentMethod: e.paymentMethod,
        date: expenseDate,
        notes: e.note,
        createdAt: now,
        updatedAt: now,
      };
    }),
  );
  console.log('Seeded demo expenses');

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
