// @ts-nocheck
/**
 * Migration: Add Subscription records for existing CompanyOwner accounts.
 *
 * Run once: npx ts-node -r tsconfig-paths/register src/database/migrations/addSubscriptions.ts
 *
 * Existing users get `plan: 'starter', status: 'active'` so they are not blocked.
 */
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Load models
const { globSync } = require('glob');
const modelDir = path.join(__dirname, '../../models');
const modelFiles = globSync('./**/*.{js,ts}', { cwd: modelDir });
for (const filePath of modelFiles) {
  try {
    require(path.resolve(path.join(modelDir, filePath)));
  } catch (e) {
    // skip non-model files
  }
}

async function migrate() {
  const dbUrl = process.env.DATABASE || process.env.MONGODB_URI;
  if (!dbUrl) {
    console.error('No DATABASE or MONGODB_URI env variable set');
    process.exit(1);
  }

  await mongoose.connect(dbUrl);
  console.log('Connected to MongoDB');

  const CompanyOwner = mongoose.model('CompanyOwner');
  const Subscription = mongoose.model('Subscription');

  const owners = await CompanyOwner.find({ removed: false });
  let created = 0;
  let skipped = 0;

  for (const owner of owners) {
    const existing = await Subscription.findOne({ companyOwner: owner._id });
    if (existing) {
      skipped++;
      continue;
    }

    await Subscription.create({
      companyOwner: owner._id,
      plan: 'starter',
      status: 'active',
      billingCycle: 'monthly',
      trialEnd: null,
    });
    created++;
  }

  console.log(`Migration complete: ${created} subscriptions created, ${skipped} already existed.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
