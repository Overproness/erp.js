// @ts-nocheck
const Joi = require('joi');
const schema = Joi.object({
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  number: Joi.number().optional(), // Will be auto-generated if not provided
  year: Joi.number().optional(), // Will be auto-generated if not provided
  status: Joi.string().optional().default('draft'), // Default status
  notes: Joi.string().allow(''),
  expiredDate: Joi.date().required(),
  date: Joi.date().required(),
  taxRate: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  items: Joi.array()
    .items(
      Joi.object({
        itemName: Joi.string().required(),
        description: Joi.string().allow(''),
        quantity: Joi.number().required().min(0),
        price: Joi.number().required().min(0),
        total: Joi.number().required().min(0),
      })
    )
    .min(1) // At least one item required
    .required(),
  owner: Joi.string(), // Will be set by backend
  createdBy: Joi.string(), // Will be set by backend
}).unknown(true); // Allow unknown fields for now

module.exports = schema;
