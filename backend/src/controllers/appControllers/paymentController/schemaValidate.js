const Joi = require('joi');

const schema = Joi.object({
  invoice: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  amount: Joi.number().required().min(0),
  paymentMode: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  date: Joi.date().required(),
  ref: Joi.string().allow(''),
  description: Joi.string().allow(''),
  currency: Joi.string(),
  owner: Joi.string(),
  createdBy: Joi.string()
}).unknown(true);

module.exports = schema;