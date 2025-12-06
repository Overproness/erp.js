const mongoose = require('mongoose');

// Migration script to convert old-format settings to new structure
const migrateSetting = async () => {
  try {
    const Setting = mongoose.model('Setting');

    // console.log('Starting settings migration...');

    // Find all settings with the old structure (settingKey, settingValue)
    const oldSettings = await Setting.find({
      settingKey: { $exists: true },
      settingValue: { $exists: true },
    });

    if (oldSettings.length === 0) {
      // console.log('No old-format settings found. Migration not needed.');
      return;
    }

    console.log(`Found ${oldSettings.length} old-format settings to migrate`);

    // Group by owner and category
    const settingsByOwnerAndCategory = {};

    oldSettings.forEach((setting) => {
      const owner = setting.owner ? setting.owner.toString() : 'global';
      let category = setting.settingCategory || 'general';

      // Map old categories to new ones
      if (category === 'money_format_settings') {
        category = 'currency';
      }

      if (!settingsByOwnerAndCategory[owner]) {
        settingsByOwnerAndCategory[owner] = {};
      }

      if (!settingsByOwnerAndCategory[owner][category]) {
        settingsByOwnerAndCategory[owner][category] = {};
      }

      settingsByOwnerAndCategory[owner][category][setting.settingKey] = setting.settingValue;
    });

    // Create new-format settings
    for (const [owner, categories] of Object.entries(settingsByOwnerAndCategory)) {
      for (const [category, data] of Object.entries(categories)) {
        const newSetting = {
          category,
          data,
          removed: false,
          enabled: true,
        };

        if (owner !== 'global') {
          newSetting.owner = new mongoose.Types.ObjectId(owner);
        }

        // Check if new-format setting already exists
        const existingNewSetting = await Setting.findOne({
          category,
          owner: newSetting.owner || null,
        });

        if (!existingNewSetting) {
          await Setting.create(newSetting);
          console.log(`Created new-format setting for category: ${category}, owner: ${owner}`);
        } else {
          // Merge data if setting exists
          await Setting.findByIdAndUpdate(existingNewSetting._id, {
            $set: {
              data: { ...existingNewSetting.data, ...data },
            },
          });
          console.log(
            `Updated existing new-format setting for category: ${category}, owner: ${owner}`
          );
        }
      }
    }

    // Delete old-format settings
    await Setting.deleteMany({
      settingKey: { $exists: true },
      settingValue: { $exists: true },
    });

    console.log(`Migration completed. Removed ${oldSettings.length} old-format settings.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = migrateSetting;
