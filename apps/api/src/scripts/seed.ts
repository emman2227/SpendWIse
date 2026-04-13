import mongoose from 'mongoose';

import { defaultCategorySeeds } from '../modules/database/seeds/default-categories.seed';

const run = async () => {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/spendwise';
  await mongoose.connect(mongoUri);

  const categoryCollection = mongoose.connection.collection('categories');
  const now = new Date();
  const result = await categoryCollection.bulkWrite(
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

  if (result.upsertedCount > 0) {
    console.log(
      `Seeded ${result.upsertedCount} default categor${result.upsertedCount === 1 ? 'y' : 'ies'}`,
    );
  } else {
    console.log('Default categories already up to date');
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
