import dns from 'node:dns';

import mongoose from 'mongoose';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Use system default DNS
}

const run = async () => {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/spendwise';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  const usersCollection = mongoose.connection.collection('users');
  const categoryCollection = mongoose.connection.collection('categories');
  const expensesCollection = mongoose.connection.collection('expenses');

  const users = await usersCollection.find({}).toArray();

  if (users.length === 0) {
    console.error('No users found in database! Please run default seed first.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${users.length} user(s) to seed recurring expenses for.`);

  const now = new Date();

  // Helper to subtract days
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - days);
    return d;
  };

  for (const user of users) {
    const userId = user._id.toString();
    console.log(`\n--- Seeding for user: ${user.email ?? userId} ---`);

    // Ensure user categories exist
    const systemCategories = await categoryCollection
      .find({ $or: [{ isSystemDefined: true }, { userId }] })
      .toArray();

    const categoryMap = new Map<string, string>();
    systemCategories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase(), cat._id.toString());
    });

    const ensureCategory = async (name: string, color: string, icon: string) => {
      const lower = name.toLowerCase();
      if (categoryMap.has(lower)) {
        return categoryMap.get(lower)!;
      }
      const insertRes = await categoryCollection.insertOne({
        userId,
        isSystemDefined: false,
        name,
        icon,
        color,
        createdAt: now,
        updatedAt: now,
      });
      const id = insertRes.insertedId.toString();
      categoryMap.set(lower, id);
      return id;
    };

    const entertainmentCatId =
      categoryMap.get('entertainment') ??
      (await ensureCategory('Entertainment', '#8B5CF6', 'film'));
    const healthCatId =
      categoryMap.get('health') ??
      categoryMap.get('health & fitness') ??
      (await ensureCategory('Health & Fitness', '#10B981', 'activity'));
    const billsCatId =
      categoryMap.get('bills') ??
      categoryMap.get('utilities') ??
      (await ensureCategory('Bills & Utilities', '#F59E0B', 'zap'));
    const foodCatId =
      categoryMap.get('food') ??
      categoryMap.get('food & dining') ??
      (await ensureCategory('Food & Dining', '#EF4444', 'utensils'));
    const shoppingCatId =
      categoryMap.get('shopping') ?? (await ensureCategory('Shopping', '#3B82F6', 'shopping-bag'));

    const itemsToSeed: Array<{
      description: string;
      amount: number;
      categoryId: string;
      paymentMethod: string;
      date: Date;
      notes?: string;
      condition: string;
    }> = [];

    // =========================================================================
    // CONDITION A: Single Transaction with Recurring Keyword Match (5 Items)
    // =========================================================================
    // 1. Netflix Subscription (Entertainment)
    itemsToSeed.push({
      description: 'Netflix Subscription',
      amount: 15.99,
      categoryId: entertainmentCatId,
      paymentMethod: 'credit_card',
      date: daysAgo(12),
      notes: 'Monthly 4K streaming plan subscription',
      condition: 'Condition A (Keyword: Subscription)',
    });

    // 2. Equinox Gym Membership (Health)
    itemsToSeed.push({
      description: 'Equinox Gym Membership',
      amount: 180.0,
      categoryId: healthCatId,
      paymentMethod: 'credit_card',
      date: daysAgo(18),
      notes: 'Monthly fitness club membership dues',
      condition: 'Condition A (Keyword: Membership, Dues)',
    });

    // 3. Apartment Rent Bill (Bills)
    itemsToSeed.push({
      description: 'Apartment Rent Bill',
      amount: 1450.0,
      categoryId: billsCatId,
      paymentMethod: 'bank_transfer',
      date: daysAgo(25),
      notes: 'Monthly residential rent payment',
      condition: 'Condition A (Keyword: Rent, Bill)',
    });

    // 4. Starlink Internet Utility (Bills)
    itemsToSeed.push({
      description: 'Starlink Internet Utility',
      amount: 110.0,
      categoryId: billsCatId,
      paymentMethod: 'debit_card',
      date: daysAgo(5),
      notes: 'High-speed broadband internet utility',
      condition: 'Condition A (Keyword: Utility, Internet)',
    });

    // 5. Geico Auto Insurance Plan (Bills)
    itemsToSeed.push({
      description: 'Geico Auto Insurance Plan',
      amount: 145.5,
      categoryId: billsCatId,
      paymentMethod: 'bank_transfer',
      date: daysAgo(14),
      notes: 'Monthly auto insurance protection plan',
      condition: 'Condition A (Keyword: Insurance, Plan)',
    });

    // =========================================================================
    // CONDITION B: Multiple (2+) Consistent Transactions over Time (5 Items)
    // No keywords in description/notes, detected purely by interval math
    // =========================================================================
    // 6. Figma Professional (Shopping / SaaS) -> 4 monthly charges (every 30 days)
    [90, 60, 30, 0].forEach((days) => {
      itemsToSeed.push({
        description: 'Figma Professional',
        amount: 15.0,
        categoryId: shoppingCatId,
        paymentMethod: 'credit_card',
        date: daysAgo(days),
        notes: 'Design editor workspace seat',
        condition: 'Condition B (4 monthly repeated charges)',
      });
    });

    // 7. Spotify Family (Entertainment) -> 3 monthly charges (every 30 days)
    [60, 30, 2].forEach((days) => {
      itemsToSeed.push({
        description: 'Spotify Family',
        amount: 19.99,
        categoryId: entertainmentCatId,
        paymentMethod: 'credit_card',
        date: daysAgo(days),
        notes: 'Audio stream premium tier',
        condition: 'Condition B (3 monthly repeated charges)',
      });
    });

    // 8. Blue Bottle Coffee (Food) -> 5 weekly charges (every 7 days)
    [28, 21, 14, 7, 0].forEach((days) => {
      itemsToSeed.push({
        description: 'Blue Bottle Coffee',
        amount: 35.0,
        categoryId: foodCatId,
        paymentMethod: 'e_wallet',
        date: daysAgo(days),
        notes: 'Fresh whole bean roast bag',
        condition: 'Condition B (5 weekly repeated charges)',
      });
    });

    // 9. DigitalOcean Droplet (Bills) -> 4 monthly charges (every 30 days)
    [90, 60, 30, 1].forEach((days) => {
      itemsToSeed.push({
        description: 'DigitalOcean Droplet',
        amount: 24.0,
        categoryId: billsCatId,
        paymentMethod: 'credit_card',
        date: daysAgo(days),
        notes: 'Cloud server hosting instance',
        condition: 'Condition B (4 monthly repeated charges)',
      });
    });

    // 10. Adobe Creative Cloud (Shopping) -> 3 monthly charges (every 30 days)
    [60, 30, 3].forEach((days) => {
      itemsToSeed.push({
        description: 'Adobe Creative Cloud',
        amount: 59.99,
        categoryId: shoppingCatId,
        paymentMethod: 'credit_card',
        date: daysAgo(days),
        notes: 'All apps designer package',
        condition: 'Condition B (3 monthly repeated charges)',
      });
    });

    // Insert all records
    const descriptions = Array.from(new Set(itemsToSeed.map((i) => i.description)));
    // Delete existing instances with these descriptions for clean idempotency
    await expensesCollection.deleteMany({
      userId,
      description: { $in: descriptions },
    });

    const docsToInsert = itemsToSeed.map((item) => ({
      _id: new mongoose.Types.ObjectId(),
      userId,
      amount: item.amount,
      categoryId: item.categoryId,
      description: item.description,
      paymentMethod: item.paymentMethod,
      date: item.date,
      notes: item.notes,
      createdAt: item.date,
      updatedAt: item.date,
    }));

    await expensesCollection.insertMany(docsToInsert);
    console.log(
      `Seeded ${docsToInsert.length} transaction entries for ${descriptions.length} recurring items:`,
    );
    console.log('  Condition A (5 items with single keyword match):');
    console.log('    1. Netflix Subscription ($15.99)');
    console.log('    2. Equinox Gym Membership ($180.00)');
    console.log('    3. Apartment Rent Bill ($1,450.00)');
    console.log('    4. Starlink Internet Utility ($110.00)');
    console.log('    5. Geico Auto Insurance Plan ($145.50)');
    console.log('  Condition B (5 items with multiple repeated charges over time):');
    console.log('    6. Figma Professional (4 charges, $15.00/mo)');
    console.log('    7. Spotify Family (3 charges, $19.99/mo)');
    console.log('    8. Blue Bottle Coffee (5 charges, $35.00/wk)');
    console.log('    9. DigitalOcean Droplet (4 charges, $24.00/mo)');
    console.log('    10. Adobe Creative Cloud (3 charges, $59.99/mo)');
  }

  await mongoose.disconnect();
  console.log('\nSeed completed successfully!');
};

run().catch(async (err) => {
  console.error('Seed error:', err);
  await mongoose.disconnect();
  process.exit(1);
});
