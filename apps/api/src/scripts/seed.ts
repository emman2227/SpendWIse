import mongoose from 'mongoose';

import { defaultCategorySeeds } from '../modules/database/seeds/default-categories.seed';

const run = async () => {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/spendwise';
  await mongoose.connect(mongoUri);

  const categoryCollection = mongoose.connection.collection('categories');
  const existingCount = await categoryCollection.countDocuments({
    isSystemDefined: true
  });

  if (existingCount === 0) {
    await categoryCollection.insertMany(
      defaultCategorySeeds.map((category) => ({
        ...category,
        isSystemDefined: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
    );
    console.log('Seeded default categories');
  } else {
    console.log('Default categories already exist');
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
