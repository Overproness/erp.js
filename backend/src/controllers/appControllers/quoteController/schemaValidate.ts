// @ts-nocheck
const Joi = require('joi');

const schema = Joi.object({
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  number: Joi.number().optional(),
  year: Joi.number().optional(),
  status: Joi.string().optional(),
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
    .min(1)
    .required(),
  owner: Joi.string(), // Will be set by backend
  createdBy: Joi.string(), // Will be set by backend
}).unknown(true);

module.exports = schema;
