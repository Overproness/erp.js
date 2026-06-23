import mongoose from 'mongoose';
import * as models from '../src/models';

const modelExports = Object.entries(models).filter(([, value]) =>
  Boolean((value as { modelName?: string }).modelName)
);

if (!modelExports.length) {
  throw new Error('The model barrel did not export any Mongoose models.');
}

for (const [exportName, model] of modelExports) {
  const modelName = (model as { modelName: string }).modelName;
  if (mongoose.models[modelName] !== model) {
    throw new Error(`${exportName} was not registered with Mongoose as ${modelName}.`);
  }
}

if (models.Tax !== models.Taxes) {
  throw new Error('The Taxes barrel alias no longer points to Tax.');
}

if (typeof (models.ReviewResponse as { getResponseRate?: unknown }).getResponseRate !== 'function') {
  throw new Error('ReviewResponse.getResponseRate is not available.');
}

console.log(`Verified ${modelExports.length} barrel-exported models and ReviewResponse statics.`);
