// @ts-nocheck
const mongoose = require('mongoose');
const CompanyOwner = mongoose.model('CompanyOwner');

/**
 * Mark the company owner as having completed company setup
 */
const completeCompanySetup = async (req, res) => {
  try {
    // Get the company owner ID from the authenticated request
    const ownerId = req.companyOwner?._id;
    
    console.log('completeCompanySetup called for company owner:', ownerId);
    
    if (!ownerId) {
      console.error('CompanyOwner ID not found in request');
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    
    // Extract company name and other data from request body with fallbacks
    const { 
      companyName = 'My Company', 
      companyAddress = '',
      companyEmail = '',
      companyPhone = '',
      companyWebsite = '',
      currencyCode,
      currencySymbol,
      currencyPosition = 'before',
      decimalSeparator,
      thousandSeparator,
      centPrecision = 2,
      dateFormat = 'DD/MM/YYYY',
      enableTax = true,
      defaultaxRate = 0
    } = req.body;
    
    const validatedCurrencyCode = currencyCode;
    
    // Map currency codes to their symbols for defaults
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'CA$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹'
    };
    
    const validatedCurrencySymbol = currencySymbol || currencySymbols[validatedCurrencyCode]
    
    // Ensure decimal and thousand separators make sense for the currency
    const validatedDecimalSep = decimalSeparator
    const validatedThousandSep = thousandSeparator
      
    console.log('Company setup data received:', {
      companyName,
      currencyCode,
      currencySymbol
    });
    
    // Update the company owner record with company name and onboarding status
    const companyOwner = await CompanyOwner.findByIdAndUpdate(
      ownerId,
      { 
        // Only use the single onboardingComplete flag
        onboardingComplete: true,
        companyName: companyName
      },
      { new: true }
    );
      
    if (!companyOwner) {
      console.error('CompanyOwner record not found for ID:', ownerId);
      return res.status(404).json({
        success: false,
        result: null,
        message: 'CompanyOwner user not found',
      });
    }
      
    console.log('CompanyOwner updated successfully:', companyOwner);
    
    // Now also update or create settings for this company owner
    try {
      console.log('Saving settings for company owner from onboarding data');
      
      // Get Setting model
      const Setting = mongoose.model('Setting');
      
      // Define settings to create or update
      const settingsToUpsert = [
        // Company settings
        {
          settingKey: 'company_name',
          settingValue: companyName || 'My Company',
          valueType: 'string',
          settingCategory: 'company_settings',
          owner: ownerId
        },
        {
          settingKey: 'company_address',
          settingValue: companyAddress || '',
          valueType: 'string',
          settingCategory: 'company_settings',
          owner: ownerId
        },
        {
          settingKey: 'company_email',
          settingValue: companyEmail || '',
          valueType: 'string',
          settingCategory: 'company_settings',
          owner: ownerId
        },
        {
          settingKey: 'company_phone',
          settingValue: companyPhone || '',
          valueType: 'string',
          settingCategory: 'company_settings',
          owner: ownerId
        },
        {
          settingKey: 'company_website',
          settingValue: companyWebsite || '',
          valueType: 'string',
          settingCategory: 'company_settings',
          owner: ownerId
        },
        
        // Currency settings
        {
          settingKey: 'currency_code',
          settingValue: validatedCurrencyCode,
          valueType: 'string',
          settingCategory: 'money_format_settings',
          owner: ownerId
        },
        {
          settingKey: 'currency_symbol',
          settingValue: validatedCurrencySymbol,
          valueType: 'string',
          settingCategory: 'money_format_settings',
          owner: ownerId
        },
        {
          settingKey: 'currency_position',
          settingValue: currencyPosition || 'before',
          valueType: 'string',
          settingCategory: 'money_format_settings',
          owner: ownerId
        },
        {
          settingKey: 'decimal_sep',
          settingValue: validatedDecimalSep,
          valueType: 'string',
          settingCategory: 'money_format_settings',
          owner: ownerId
        },
        {
          settingKey: 'thousand_sep',
          settingValue: validatedThousandSep,
          valueType: 'string',
          settingCategory: 'money_format_settings',
          owner: ownerId
        },
        {
          settingKey: 'cent_precision',
          settingValue: centPrecision || 2,
          valueType: 'number',
          settingCategory: 'money_format_settings',
          owner: ownerId
        },
        
        // General settings
        {
          settingKey: 'date_format',
          settingValue: dateFormat || 'DD/MM/YYYY',
          valueType: 'string',
          settingCategory: 'general_settings',
          owner: ownerId
        }
      ];
      
      // Use upsert for each setting (create if doesn't exist, update if exists)
      for (const setting of settingsToUpsert) {
        await Setting.findOneAndUpdate(
          { 
            settingKey: setting.settingKey,
            owner: ownerId
          },
          setting,
          { 
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );
      }
      
      console.log('Settings saved for company owner from onboarding data');
    } catch (settingsError) {
      console.error('Error saving settings during company setup:', settingsError);
      // Continue even if settings save fails
    }
      
    // Also update the finance settings with a direct connection to the currency
    try {
      console.log('Updating finance settings with currency details for owner:', ownerId);
      
      const FinanceSettings = mongoose.model('FinanceSettings');
      const Currency = mongoose.model('Currency');
      
      // First check if we already have any currencies for this owner
      const existingCurrencies = await Currency.find({ 
        owner: ownerId,
        removed: false
      });
      
      console.log(`Found ${existingCurrencies.length} existing currencies for this owner`);
      if (existingCurrencies.length > 0) {
        console.log('Currency codes:', existingCurrencies.map(c => c.code));
      }      
      // First find a currency matching the specified currency code for this owner
      let defaultCurrency = null;
      
      if (validatedCurrencyCode) {
        console.log(`Looking for currency with code ${validatedCurrencyCode} for owner ${ownerId}`);
        defaultCurrency = await Currency.findOne({
          owner: ownerId,
          code: validatedCurrencyCode,
          removed: false
        });
          // If currency not found, create it
        if (!defaultCurrency) {
          console.log(`Currency ${validatedCurrencyCode} not found for owner ${ownerId}, creating it now`);
          
          // Determine currency name
          const currencyNames = {
            'USD': 'US Dollar',
            'EUR': 'Euro',
            'GBP': 'British Pound',
            'CAD': 'Canadian Dollar',
            'AUD': 'Australian Dollar',
            'INR': 'Indian Rupee',
            'JPY': 'Japanese Yen',
            'CHF': 'Swiss Franc',
            'CNY': 'Chinese Yuan'
          };
          
          const name = currencyNames[validatedCurrencyCode] || `${validatedCurrencyCode} Currency`;
          
          // Create new currency with proper validation - always use the requested currency code
          const currencyData = {
            name: name,
            code: validatedCurrencyCode,
            symbol: validatedCurrencySymbol,
            decimal_separator: validatedDecimalSep,
            thousand_separator: validatedThousandSep,
            cent_precision: centPrecision || 2,
            isDefault: true,
            enabled: true,
            owner: ownerId,
            createdBy: ownerId
          };
          
          console.log(`Creating currency for owner ${ownerId} with data:`, currencyData);
          defaultCurrency = new Currency(currencyData);
          
          await defaultCurrency.save();
          console.log(`Created new currency: ${defaultCurrency.name} (${defaultCurrency.code}) for owner ${ownerId}`);
          
          // Ensure all other currencies for this owner are not default
          await Currency.updateMany(
            { owner: ownerId, _id: { $ne: defaultCurrency._id } },
            { isDefault: false }
          );
        } 
        // If found, make sure it's set as default
        else {
          console.log(`Found currency by code ${validatedCurrencyCode} for owner ${ownerId}, setting as default`);
          
          // Set all other currencies for this owner to not default
          await Currency.updateMany(
            { owner: ownerId, _id: { $ne: defaultCurrency._id } },
            { isDefault: false }
          );
          
          // Update this currency to be default
          defaultCurrency.isDefault = true;
          defaultCurrency.symbol = validatedCurrencySymbol; // Update symbol if provided
          defaultCurrency.decimal_separator = validatedDecimalSep; // Update decimal separator if provided
          defaultCurrency.thousand_separator = validatedThousandSep; // Update thousand separator if provided
          
          await defaultCurrency.save();
          console.log(`Updated existing currency as default: ${defaultCurrency.name} (${defaultCurrency.code}) for owner ${ownerId}`);
        }
      }
      
      // If we still couldn't find or create a currency, fall back to any default currency
      if (!defaultCurrency) {
        defaultCurrency = await Currency.findOne({
          owner: ownerId,
          isDefault: true,
          removed: false
        });
      }
      
      // If still no default currency, create a generic USD one
      if (!defaultCurrency) {
        defaultCurrency = new Currency({
          name: 'US Dollar',
          code: 'USD',
          symbol: '$',
          decimal_separator: '.',
          thousand_separator: ',',
          cent_precision: 2,
          isDefault: true,
          enabled: true,
          owner: ownerId,
          createdBy: ownerId
        });
        
        await defaultCurrency.save();
        console.log('Created fallback USD currency');
      }
      
      if (defaultCurrency) {
    // Find or create finance settings
        let financeSettings = await FinanceSettings.findOne({
          owner: ownerId,
          removed: false
        });
        
        if (!financeSettings) {
          financeSettings = new FinanceSettings({
            owner: ownerId,
            createdBy: ownerId,
            companyName: companyName || 'My Company',
            currencySettings: {
              defaultCurrency: defaultCurrency._id,
              showCurrencySymbol: true
            }
          });
        } else {
          financeSettings.companyName = companyName || financeSettings.companyName;
          financeSettings.currencySettings = {
            ...financeSettings.currencySettings,
            defaultCurrency: defaultCurrency._id,
            showCurrencySymbol: true
          };
        }
        
        await financeSettings.save();
        console.log('Finance settings updated with default currency');
      }
    } catch (financeError) {
      console.error('Error updating finance settings:', financeError);
      // Continue even if finance settings update fails
    }
    
    return res.status(200).json({
      success: true,
      result: {
        _id: companyOwner._id,
        onboardingComplete: companyOwner.onboardingComplete,
        companyName: companyOwner.companyName
      },
      message: 'Company setup completed successfully',
    });
  } catch (error) {
    console.error('Error completing company setup:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error during company setup completion',
      error: error.message,
    });
  }
};

module.exports = completeCompanySetup;
