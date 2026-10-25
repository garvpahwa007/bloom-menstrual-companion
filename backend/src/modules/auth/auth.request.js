import Joi from 'joi';
import { ApiError } from '../../utilities/api-error.js';

const password = Joi.string().min(12).max(128).required();
export const credentialsSchema = Joi.object({
  username: Joi.string().pattern(/^[a-z0-9_]{3,32}$/).required(),
  password,
}).required().unknown(false);
export const deleteAccountSchema = Joi.object({ password }).required().unknown(false);
export const emptySchema = Joi.object({}).required().unknown(false);

export function validateBody(schema, body) {
  const { value, error } = schema.validate(body, { abortEarly: false, convert: false });
  if (error) throw new ApiError(400, 'BODY_INVALID', 'The request body is invalid.');
  return value;
}
