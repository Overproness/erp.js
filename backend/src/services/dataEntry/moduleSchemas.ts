// @ts-nocheck
/**
 * Module Schema Definitions for Data Entry Automation
 * Defines field mappings, validation rules, and AI extraction prompts for each module
 */

const moduleSchemas = {
  // Customer/Client Module
  client: {
    name: 'Client',
    model: 'Client',
    fields: {
      name: {
        type: 'string',
        required: true,
        aliases: ['customer name', 'client name', 'company name', 'business name'],
      },
      email: {
        type: 'email',
        required: true,
        aliases: ['email address', 'contact email', 'e-mail'],
      },
      phone: {
        type: 'phone',
        required: true,
        aliases: ['phone number', 'telephone', 'mobile', 'contact number'],
      },
      address: {
        type: 'string',
        required: false,
        aliases: ['street address', 'location', 'address'],
      },
      country: { type: 'string', required: false, aliases: ['country', 'nation'] },
      customerType: {
        type: 'enum',
        enum: ['individual', 'company'],
        default: 'company',
        aliases: ['type', 'customer type'],
      },
      industry: {
        type: 'string',
        required: false,
        aliases: ['industry', 'sector', 'business type'],
      },
      size: {
        type: 'enum',
        enum: ['Small', 'Medium', 'Large'],
        default: 'Small',
        aliases: ['company size', 'size'],
      },
      tags: { type: 'array', required: false, aliases: ['tags', 'labels', 'categories'] },
    },
    aiPrompt:
      'Extract customer/client information including name, email, phone, address, country, customer type (individual/company), industry, and company size.',
  },

  // Quote Module
  quote: {
    name: 'Quote',
    model: 'Quote',
    fields: {
      client: {
        type: 'reference',
        ref: 'Client',
        required: true,
        aliases: ['client', 'customer', 'client name'],
      },
      date: { type: 'date', required: true, aliases: ['quote date', 'date', 'issue date'] },
      expiredDate: {
        type: 'date',
        required: true,
        aliases: ['expiry date', 'valid until', 'due date', 'expiration'],
      },
      content: { type: 'string', required: false, aliases: ['description', 'content', 'notes'] },
      items: {
        type: 'array',
        required: true,
        itemSchema: {
          itemName: {
            type: 'string',
            required: true,
            aliases: ['item', 'product', 'service', 'item name'],
          },
          description: { type: 'string', required: false, aliases: ['description', 'details'] },
          quantity: { type: 'number', required: true, aliases: ['qty', 'quantity', 'amount'] },
          price: {
            type: 'number',
            required: true,
            aliases: ['price', 'unit price', 'rate', 'cost'],
          },
          total: { type: 'number', required: true, aliases: ['total', 'line total', 'amount'] },
        },
        aliases: ['items', 'line items', 'products', 'services'],
      },
      taxRate: { type: 'number', required: false, aliases: ['tax rate', 'tax', 'vat rate'] },
      subTotal: {
        type: 'number',
        required: false,
        aliases: ['subtotal', 'sub total', 'net amount'],
      },
      taxTotal: {
        type: 'number',
        required: false,
        aliases: ['tax amount', 'tax total', 'vat amount'],
      },
      total: { type: 'number', required: false, aliases: ['total', 'grand total', 'total amount'] },
    },
    aiPrompt:
      'Extract quote information including client name, dates, line items (item name, quantity, price, total), tax rate, subtotal, and total amount.',
  },

  // Invoice Module
  invoice: {
    name: 'Invoice',
    model: 'Invoice',
    fields: {
      client: {
        type: 'reference',
        ref: 'Client',
        required: true,
        aliases: ['client', 'customer', 'billed to'],
      },
      date: { type: 'date', required: true, aliases: ['invoice date', 'date', 'issue date'] },
      expiredDate: {
        type: 'date',
        required: true,
        aliases: ['due date', 'payment due', 'expiry date'],
      },
      content: { type: 'string', required: false, aliases: ['description', 'content', 'notes'] },
      items: {
        type: 'array',
        required: true,
        itemSchema: {
          itemName: {
            type: 'string',
            required: true,
            aliases: ['item', 'product', 'service', 'item name'],
          },
          description: { type: 'string', required: false, aliases: ['description', 'details'] },
          quantity: { type: 'number', required: true, aliases: ['qty', 'quantity', 'amount'] },
          price: {
            type: 'number',
            required: true,
            aliases: ['price', 'unit price', 'rate', 'cost'],
          },
          total: { type: 'number', required: true, aliases: ['total', 'line total', 'amount'] },
        },
        aliases: ['items', 'line items', 'products', 'services'],
      },
      taxRate: { type: 'number', required: false, aliases: ['tax rate', 'tax', 'vat rate'] },
      subTotal: {
        type: 'number',
        required: false,
        aliases: ['subtotal', 'sub total', 'net amount'],
      },
      taxTotal: {
        type: 'number',
        required: false,
        aliases: ['tax amount', 'tax total', 'vat amount'],
      },
      total: { type: 'number', required: false, aliases: ['total', 'grand total', 'total amount'] },
    },
    aiPrompt:
      'Extract invoice information including client name, invoice date, due date, line items (item name, quantity, price, total), tax rate, subtotal, and total amount.',
  },

  // Payment Module
  payment: {
    name: 'Payment',
    model: 'Payment',
    fields: {
      client: {
        type: 'reference',
        ref: 'Client',
        required: true,
        aliases: ['client', 'customer', 'payer'],
      },
      invoice: {
        type: 'reference',
        ref: 'Invoice',
        required: true,
        aliases: ['invoice', 'invoice number', 'invoice ref'],
      },
      date: { type: 'date', required: true, aliases: ['payment date', 'date', 'transaction date'] },
      amount: {
        type: 'number',
        required: true,
        aliases: ['amount', 'payment amount', 'total paid'],
      },
      currency: {
        type: 'string',
        required: true,
        default: 'USD',
        aliases: ['currency', 'currency code'],
      },
      paymentMode: {
        type: 'reference',
        ref: 'PaymentMode',
        required: false,
        aliases: ['payment method', 'payment mode', 'mode'],
      },
      ref: {
        type: 'string',
        required: false,
        aliases: ['reference', 'transaction ref', 'ref number'],
      },
      description: { type: 'string', required: false, aliases: ['description', 'notes', 'memo'] },
    },
    aiPrompt:
      'Extract payment information including client name, invoice reference, payment date, amount, currency, payment method, transaction reference, and description.',
  },

  // Payment Method/Mode Module
  paymentMode: {
    name: 'PaymentMode',
    model: 'PaymentMode',
    fields: {
      name: { type: 'string', required: true, aliases: ['name', 'payment method', 'method name'] },
      description: {
        type: 'string',
        required: false,
        aliases: ['description', 'details', 'notes'],
      },
      enabled: { type: 'boolean', default: true, aliases: ['enabled', 'active', 'status'] },
    },
    aiPrompt: 'Extract payment method information including method name and description.',
  },

  // Tax Module
  taxes: {
    name: 'Taxes',
    model: 'Taxes',
    fields: {
      taxName: { type: 'string', required: true, aliases: ['tax name', 'name', 'tax type'] },
      taxRate: { type: 'number', required: true, aliases: ['rate', 'tax rate', 'percentage', '%'] },
      description: {
        type: 'string',
        required: false,
        aliases: ['description', 'details', 'notes'],
      },
      enabled: { type: 'boolean', default: true, aliases: ['enabled', 'active', 'status'] },
    },
    aiPrompt: 'Extract tax information including tax name, tax rate (percentage), and description.',
  },

  // Task Module
  task: {
    name: 'Task',
    model: 'Task',
    fields: {
      title: { type: 'string', required: true, aliases: ['title', 'task name', 'name'] },
      description: {
        type: 'string',
        required: false,
        aliases: ['description', 'details', 'notes'],
      },
      status: {
        type: 'enum',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
        aliases: ['status', 'state'],
      },
      priority: {
        type: 'enum',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        aliases: ['priority', 'importance'],
      },
      dueDate: { type: 'date', required: false, aliases: ['due date', 'deadline', 'target date'] },
      assignedTo: {
        type: 'reference',
        ref: 'Admin',
        required: false,
        aliases: ['assigned to', 'assignee', 'owner'],
      },
      // Module Integration Fields
      customer: {
        type: 'reference',
        ref: 'Client',
        required: false,
        aliases: ['client', 'customer', 'customer name'],
      },
      invoice: {
        type: 'reference',
        ref: 'Invoice',
        required: false,
        aliases: ['invoice', 'invoice number', 'invoice ref'],
      },
      quote: {
        type: 'reference',
        ref: 'Quote',
        required: false,
        aliases: ['quote', 'quotation', 'quote number'],
      },
      document: {
        type: 'reference',
        ref: 'Document',
        required: false,
        aliases: ['document', 'file', 'attachment'],
      },
      appointment: {
        type: 'reference',
        ref: 'Appointment',
        required: false,
        aliases: ['appointment', 'meeting', 'schedule'],
      },
    },
    aiPrompt:
      'Extract task information including title, description, status, priority, due date, assigned person, related customer, invoice/quote, and documents.',
  },

  // Appointment Module
  appointment: {
    name: 'Appointment',
    model: 'Appointment',
    fields: {
      title: { type: 'string', required: true, aliases: ['title', 'meeting title', 'subject'] },
      description: {
        type: 'string',
        required: false,
        aliases: ['description', 'details', 'notes', 'agenda'],
      },
      startDate: {
        type: 'datetime',
        required: true,
        aliases: ['start date', 'start time', 'from'],
      },
      endDate: { type: 'datetime', required: true, aliases: ['end date', 'end time', 'to'] },
      location: { type: 'string', required: false, aliases: ['location', 'venue', 'place'] },
      client: {
        type: 'reference',
        ref: 'Client',
        required: false,
        aliases: ['client', 'customer', 'attendee'],
      },
      assignedTo: {
        type: 'reference',
        ref: 'Admin',
        required: false,
        aliases: ['assigned to', 'host', 'organizer'],
      },
      status: {
        type: 'enum',
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
        default: 'scheduled',
        aliases: ['status', 'state'],
      },
    },
    aiPrompt:
      'Extract appointment information including title, description, start date/time, end date/time, location, attendees, and status.',
  },

  // Team/Admin Module
  team: {
    name: 'Team',
    model: 'Admin',
    fields: {
      name: { type: 'string', required: true, aliases: ['name', 'full name', 'team member name'] },
      email: {
        type: 'email',
        required: true,
        aliases: ['email', 'email address', 'contact email'],
      },
      phone: { type: 'phone', required: false, aliases: ['phone', 'phone number', 'mobile'] },
      role: { type: 'string', required: false, aliases: ['role', 'position', 'title'] },
      department: { type: 'string', required: false, aliases: ['department', 'team', 'division'] },
    },
    aiPrompt:
      'Extract team member information including name, email, phone, role/position, and department.',
  },

  // Follow-up Module
  followUp: {
    name: 'FollowUp',
    model: 'FollowUp',
    fields: {
      client: { type: 'reference', ref: 'Client', required: true, aliases: ['client', 'customer'] },
      subject: { type: 'string', required: true, aliases: ['subject', 'title', 'regarding'] },
      description: {
        type: 'string',
        required: false,
        aliases: ['description', 'details', 'notes'],
      },
      scheduledDate: {
        type: 'date',
        required: true,
        aliases: ['scheduled date', 'follow-up date', 'date'],
      },
      status: {
        type: 'enum',
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
        aliases: ['status', 'state'],
      },
      priority: {
        type: 'enum',
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        aliases: ['priority'],
      },
      assignedTo: {
        type: 'reference',
        ref: 'Admin',
        required: false,
        aliases: ['assigned to', 'owner'],
      },
    },
    aiPrompt:
      'Extract follow-up information including client name, subject, scheduled date, status, priority, and assigned person.',
  },

  // URL Module
  url: {
    name: 'URL',
    model: 'URL',
    fields: {
      url: { type: 'url', required: true, aliases: ['url', 'link', 'website'] },
      title: { type: 'string', required: false, aliases: ['title', 'name', 'page title'] },
      description: { type: 'string', required: false, aliases: ['description', 'notes'] },
      category: { type: 'string', required: false, aliases: ['category', 'type'] },
      client: {
        type: 'reference',
        ref: 'Client',
        required: false,
        aliases: ['client', 'customer'],
      },
    },
    aiPrompt: 'Extract URL information including the link, title, description, and category.',
  },
};

/**
 * Get schema for a specific module
 */
function getModuleSchema(moduleName) {
  const schema = moduleSchemas[moduleName.toLowerCase()];
  if (!schema) {
    throw new Error(`Schema not found for module: ${moduleName}`);
  }
  return schema;
}

/**
 * Get all available module schemas
 */
function getAllSchemas() {
  return Object.keys(moduleSchemas);
}

/**
 * Find field mapping based on column name or alias
 */
function findFieldMapping(moduleName, columnName) {
  const schema = getModuleSchema(moduleName);
  const lowerColumnName = columnName.toLowerCase().trim();

  for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
    if (fieldName.toLowerCase() === lowerColumnName) {
      return { fieldName, fieldConfig };
    }

    if (fieldConfig.aliases && Array.isArray(fieldConfig.aliases)) {
      const aliasMatch = fieldConfig.aliases.find(
        (alias) => alias.toLowerCase() === lowerColumnName
      );
      if (aliasMatch) {
        return { fieldName, fieldConfig };
      }
    }
  }

  return null;
}

/**
 * Validate data against module schema
 */
function validateData(moduleName, data) {
  const schema = getModuleSchema(moduleName);
  const errors = [];
  const warnings = [];

  for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
    const value = data[fieldName];

    // Check required fields
    if (fieldConfig.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `Field '${fieldName}' is required`,
        type: 'required',
      });
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      // Type validation
      if (fieldConfig.type === 'email' && !isValidEmail(value)) {
        errors.push({
          field: fieldName,
          message: `Invalid email format for field '${fieldName}'`,
          type: 'format',
        });
      }

      if (fieldConfig.type === 'phone' && !isValidPhone(value)) {
        warnings.push({
          field: fieldName,
          message: `Potentially invalid phone format for field '${fieldName}'`,
          type: 'format',
        });
      }

      if (fieldConfig.type === 'number' && isNaN(Number(value))) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be a number`,
          type: 'type',
        });
      }

      if (fieldConfig.type === 'date' || fieldConfig.type === 'datetime') {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push({
            field: fieldName,
            message: `Invalid date format for field '${fieldName}'`,
            type: 'format',
          });
        }
      }

      if (fieldConfig.type === 'enum' && fieldConfig.enum) {
        if (!fieldConfig.enum.includes(value)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be one of: ${fieldConfig.enum.join(', ')}`,
            type: 'enum',
          });
        }
      }

      if (fieldConfig.type === 'url' && !isValidUrl(value)) {
        errors.push({
          field: fieldName,
          message: `Invalid URL format for field '${fieldName}'`,
          type: 'format',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper validation functions
function isValidEmail(email) {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email);
}

function isValidPhone(phone) {
  // Basic phone validation - can be enhanced
  return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  moduleSchemas,
  getModuleSchema,
  getAllSchemas,
  findFieldMapping,
  validateData,
};
