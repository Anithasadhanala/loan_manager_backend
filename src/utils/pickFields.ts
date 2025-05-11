import {fieldSelectors} from '../config/fieldSelectors';

type ModelName = keyof typeof fieldSelectors;

export const pickFields = (model: ModelName, object: Record<string, any>): Record<string, any> => {
  const fieldsToPick = fieldSelectors[model];

  if (!fieldsToPick) {
    throw new Error(`No field selectors defined for model: ${model}`);
  }

  return fieldsToPick.reduce((acc: Record<string, any>, field: string) => {
    if (object && Object.prototype.hasOwnProperty.call(object, field)) {
      acc[field] = object[field];
    }
    return acc;
  }, {});
};
