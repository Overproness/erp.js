// @ts-nocheck
import { globSync } from 'glob';
import { generate as uniqueId } from 'shortid';
import fs from 'fs';
import mongoose from 'mongoose';
import CompanyOwner from '../models/coreModels/CompanyOwner';
import CompanyOwnerPassword from '../models/coreModels/CompanyOwnerPassword';
import Setting from '../models/coreModels/Setting';
import PaymentMode from '../models/appModels/PaymentMode';
import Taxes from '../models/appModels/Taxes';
import { createRequire } from 'module';
const load = createRequire(__filename);
load('dotenv').config({ path: '.env' });
load('dotenv').config({ path: '.env.local' });


async function connectToDatabase() {
  console.log('🔌 Connecting to database...');
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully');

    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established properly');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

async function clearDatabase() {
  console.log('🗑️ Clearing database...');
  try {
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    const collections = await mongoose.connection.db.collections();

    if (!collections || collections.length === 0) {
      console.log('No collections found, database may be empty already');
      return;
    }

    for (const collection of collections) {
      try {
        await collection.deleteMany({});
        console.log(`✅ Cleared collection: ${collection.collectionName}`);
      } catch (error) {
        console.error(`Error clearing collection ${collection.collectionName}:`, error);
      }
    }

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

async function setupApp() {
  try {
    console.log('🚀 Starting setup process...');

    await connectToDatabase();
    await clearDatabase();

    console.log('📦 Creating core data...');


    console.log('👤 Creating company owner user...');
    const demoOwner = {
      email: 'admin@demo.com',
      name: 'Company',
      surname: 'Owner',
      enabled: true,
      role: 'owner',
    };

    const ownerUser = await new CompanyOwner(demoOwner).save();
    console.log(`✅ CompanyOwner created with ID: ${ownerUser._id}`);

    const newOwnerPassword = new CompanyOwnerPassword();
    const salt = uniqueId();
    const passwordHash = newOwnerPassword.generateHash(salt, 'admin123');

    await new CompanyOwnerPassword({
      password: passwordHash,
      emailVerified: true,
      salt: salt,
      user: ownerUser._id,
    }).save();
    console.log('👍 CompanyOwner password created');

    console.log('⚙️ Loading settings files...');
    const settingFiles = [];
    const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

    console.log(`Found ${settingsFiles.length} setting files`);

    // Group settings by category
    const settingsByCategory = {};

    for (const filePath of settingsFiles) {
      try {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const setting of file) {
          const { settingCategory, settingKey, settingValue } = setting;

          if (!settingsByCategory[settingCategory]) {
            settingsByCategory[settingCategory] = {};
          }

          settingsByCategory[settingCategory][settingKey] = settingValue;
        }
      } catch (error) {
        console.error(`Error loading settings from ${filePath}:`, error);
      }
    }

    // Convert to new format
    for (const [category, data] of Object.entries(settingsByCategory)) {
      settingFiles.push({
        category,
        data,
        owner: ownerUser._id,
        created: new Date(),
        createdBy: ownerUser._id,
      });
    }

    console.log(`Inserting ${settingFiles.length} setting categories...`);
    await Setting.insertMany(settingFiles);
    console.log('👍 Settings created');

    console.log('💰 Creating tax entries...');
    await Taxes.insertMany([
      {
        name: 'Tax 0%',
        taxValue: 0,
        taxRate: 0,
        isDefault: true,
        enabled: true,
        owner: ownerUser._id,
        createdBy: ownerUser._id,
      },
      {
        name: 'Sales Tax 10%',
        taxValue: 10,
        taxRate: 10,
        isDefault: false,
        enabled: true,
        owner: ownerUser._id,
        createdBy: ownerUser._id,
      },
      {
        name: 'VAT 20%',
        taxValue: 20,
        taxRate: 20,
        isDefault: false,
        enabled: true,
        owner: ownerUser._id,
        createdBy: ownerUser._id,
      },
    ]);
    console.log('👍 Tax entries created');

    console.log('💳 Creating payment modes...');
    await PaymentMode.insertMany([
      {
        name: 'Cash',
        description: 'Cash payment',
        isDefault: true,
        enabled: true,
        owner: ownerUser._id,
        createdBy: ownerUser._id,
      },
      {
        name: 'Bank Transfer',
        description: 'Payment via bank transfer',
        isDefault: false,
        enabled: true,
        owner: ownerUser._id,
        createdBy: ownerUser._id,
      },
      {
        name: 'Credit Card',
        description: 'Payment via credit card',
        isDefault: false,
        enabled: true,
        owner: ownerUser._id,
        createdBy: ownerUser._id,
      },
    ]);
    console.log('👍 Payment modes created');

    // No Currency block here — removed by user request

    const defaultTax = await Taxes.findOne({ isDefault: true });

    console.log('📊 Creating finance settings...');
    await Setting.create({
      category: 'finance',
      data: {
        taxSettings: {
          enableTax: true,
          defaultTax: defaultTax._id,
        },
        currencySettings: {
          showCurrencySymbol: true,
        },
        generalSettings: {
          financialYearStart: new Date(new Date().getFullYear(), 0, 1),
          financialYearEnd: new Date(new Date().getFullYear(), 11, 31),
          defaultInvoiceTerms: 'Payment due within 30 days of receipt.',
          defaultQuoteTerms: 'This quote is valid for 30 days.',
        },
        counters: {
          invoice: 1,
          quote: 1,
          offer: 1,
          payment: 1,
        },
        prefixes: {
          invoice: 'INV-',
          quote: 'QUOTE-',
          offer: 'OFFER-',
          payment: 'PAY-',
        },
        defaults: {
          invoiceDueTime: 14,
          quoteExpireTime: 14,
          taxRate: 0,
          discountRate: 0,
        },
      },
      owner: ownerUser._id,
      createdBy: ownerUser._id,
    });
    console.log('👍 Finance settings created');

    console.log('✨ Setup completed successfully!');

    return {
      success: true,
      message: 'Setup completed successfully',
      result: {
        owner: `Created company owner user: ${ownerUser.email}`,
        settings: `Created ${settingFiles.length} settings`,
        taxes: 'Created default taxes',
        paymentModes: 'Created default payment modes',
        financeSettings: 'Created default finance settings',
      },
    };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

if (require.main === module) {
  setupApp()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export = { setupApp };
