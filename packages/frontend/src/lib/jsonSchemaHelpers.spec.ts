/**
 * JSON Schema Helpers Tests
 *
 * Comprehensive test coverage for JSON Schema parsing, validation, and conversion utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  parseJSONSchema,
  convertValueToType,
  validateSchemaValue,
  formatValueForInput,
  getPlaceholder,
  type ParsedSchemaProperty,
} from './jsonSchemaHelpers';

describe('jsonSchemaHelpers', () => {
  describe('parseJSONSchema', () => {
    it('should parse a simple schema with properties', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
          age: { type: 'number' },
        },
        required: ['name'],
      });

      const result = parseJSONSchema(schema);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'name',
        type: 'string',
        description: 'User name',
        required: true,
        default: undefined,
      });
      expect(result[1]).toEqual({
        name: 'age',
        type: 'number',
        description: undefined,
        required: false,
        default: undefined,
      });
    });

    it('should handle enum properties', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
        },
      });

      const result = parseJSONSchema(schema);

      expect(result[0].type).toBe('enum');
      expect(result[0].enumValues).toEqual(['active', 'inactive', 'pending']);
    });

    it('should include number constraints', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          score: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            multipleOf: 5,
          },
        },
      });

      const result = parseJSONSchema(schema);

      expect(result[0]).toMatchObject({
        name: 'score',
        type: 'number',
        minimum: 0,
        maximum: 100,
        multipleOf: 5,
      });
    });

    it('should include string constraints', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9_]+$',
            format: 'email',
          },
        },
      });

      const result = parseJSONSchema(schema);

      expect(result[0]).toMatchObject({
        name: 'username',
        type: 'string',
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_]+$',
        format: 'email',
      });
    });

    it('should store schema for arrays and objects', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object', properties: { key: { type: 'string' } } },
        },
      });

      const result = parseJSONSchema(schema);

      expect(result[0].schema).toBeDefined();
      expect(result[0].schema?.type).toBe('array');
      expect(result[1].schema).toBeDefined();
      expect(result[1].schema?.type).toBe('object');
    });

    it('should handle default values', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          active: { type: 'boolean', default: true },
          count: { type: 'number', default: 0 },
          name: { type: 'string', default: 'unnamed' },
        },
      });

      const result = parseJSONSchema(schema);

      expect(result[0].default).toBe(true);
      expect(result[1].default).toBe(0);
      expect(result[2].default).toBe('unnamed');
    });

    it('should return empty array for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = parseJSONSchema('invalid json');
      expect(result).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array for schema without properties', () => {
      const schema = JSON.stringify({ type: 'object' });
      const result = parseJSONSchema(schema);
      expect(result).toEqual([]);
    });

    it('should handle integer type', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          port: { type: 'integer' },
        },
      });

      const result = parseJSONSchema(schema);
      expect(result[0].type).toBe('integer');
    });

    it('should handle boolean type', () => {
      const schema = JSON.stringify({
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
        },
      });

      const result = parseJSONSchema(schema);
      expect(result[0].type).toBe('boolean');
    });
  });

  describe('convertValueToType', () => {
    it('should convert to boolean', () => {
      expect(convertValueToType('true', 'boolean')).toBe(true);
      expect(convertValueToType('false', 'boolean')).toBe(false);
      expect(convertValueToType(true, 'boolean')).toBe(true);
      expect(convertValueToType(false, 'boolean')).toBe(false);
    });

    it('should handle empty values for boolean', () => {
      expect(convertValueToType('', 'boolean')).toBeUndefined();
      expect(convertValueToType(null, 'boolean')).toBeUndefined();
      expect(convertValueToType(undefined, 'boolean')).toBeUndefined();
    });

    it('should convert to number', () => {
      expect(convertValueToType('42', 'number')).toBe(42);
      expect(convertValueToType('3.14', 'number')).toBe(3.14);
      expect(convertValueToType(42, 'number')).toBe(42);
    });

    it('should convert to integer', () => {
      expect(convertValueToType('42', 'integer')).toBe(42);
      expect(convertValueToType(42, 'integer')).toBe(42);
    });

    it('should handle invalid numbers', () => {
      expect(convertValueToType('invalid', 'number')).toBeUndefined();
      expect(convertValueToType('', 'number')).toBeUndefined();
    });

    it('should parse JSON for arrays', () => {
      const arrayStr = '["item1", "item2"]';
      expect(convertValueToType(arrayStr, 'array')).toEqual(['item1', 'item2']);
    });

    it('should parse JSON for objects', () => {
      const objStr = '{"key": "value"}';
      expect(convertValueToType(objStr, 'object')).toEqual({ key: 'value' });
    });

    it('should handle invalid JSON for arrays/objects', () => {
      expect(convertValueToType('invalid json', 'array')).toBeUndefined();
      expect(convertValueToType('invalid json', 'object')).toBeUndefined();
    });

    it('should pass through already parsed arrays/objects', () => {
      const arr = ['item1', 'item2'];
      const obj = { key: 'value' };
      expect(convertValueToType(arr, 'array')).toBe(arr);
      expect(convertValueToType(obj, 'object')).toBe(obj);
    });

    it('should convert to string', () => {
      expect(convertValueToType(42, 'string')).toBe('42');
      expect(convertValueToType(true, 'string')).toBe('true');
      expect(convertValueToType('hello', 'string')).toBe('hello');
    });

    it('should convert to enum (treated as string)', () => {
      expect(convertValueToType('option1', 'enum')).toBe('option1');
    });
  });

  describe('validateSchemaValue', () => {
    describe('required field validation', () => {
      const requiredProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'string',
        required: true,
      };

      it('should fail validation for required field with undefined', () => {
        const result = validateSchemaValue(undefined, requiredProp);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('This field is required');
      });

      it('should fail validation for required field with null', () => {
        const result = validateSchemaValue(null, requiredProp);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('This field is required');
      });

      it('should fail validation for required field with empty string', () => {
        const result = validateSchemaValue('', requiredProp);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('This field is required');
      });

      it('should pass validation for required field with value', () => {
        const result = validateSchemaValue('value', requiredProp);
        expect(result.valid).toBe(true);
      });
    });

    describe('optional field validation', () => {
      const optionalProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'string',
        required: false,
      };

      it('should pass validation for optional field with undefined', () => {
        const result = validateSchemaValue(undefined, optionalProp);
        expect(result.valid).toBe(true);
      });

      it('should pass validation for optional field with null', () => {
        const result = validateSchemaValue(null, optionalProp);
        expect(result.valid).toBe(true);
      });

      it('should pass validation for optional field with empty string', () => {
        const result = validateSchemaValue('', optionalProp);
        expect(result.valid).toBe(true);
      });
    });

    describe('string validation', () => {
      it('should validate minLength', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'string',
          required: false,
          minLength: 3,
        };

        expect(validateSchemaValue('ab', prop).valid).toBe(false);
        expect(validateSchemaValue('ab', prop).error).toBe('Minimum length is 3');
        expect(validateSchemaValue('abc', prop).valid).toBe(true);
      });

      it('should validate maxLength', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'string',
          required: false,
          maxLength: 5,
        };

        expect(validateSchemaValue('123456', prop).valid).toBe(false);
        expect(validateSchemaValue('123456', prop).error).toBe('Maximum length is 5');
        expect(validateSchemaValue('12345', prop).valid).toBe(true);
      });

      it('should validate pattern', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'string',
          required: false,
          pattern: '^[a-z]+$',
        };

        expect(validateSchemaValue('abc123', prop).valid).toBe(false);
        expect(validateSchemaValue('abc123', prop).error).toBe('Invalid format');
        expect(validateSchemaValue('abc', prop).valid).toBe(true);
      });

      it('should fail for non-string value', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'string',
          required: false,
        };

        expect(validateSchemaValue(123, prop).valid).toBe(false);
        expect(validateSchemaValue(123, prop).error).toBe('Must be a string');
      });
    });

    describe('enum validation', () => {
      const enumProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'enum',
        required: false,
        enumValues: ['option1', 'option2', 'option3'],
      };

      it('should accept valid enum values', () => {
        expect(validateSchemaValue('option1', enumProp).valid).toBe(true);
        expect(validateSchemaValue('option2', enumProp).valid).toBe(true);
      });

      it('should reject invalid enum values', () => {
        const result = validateSchemaValue('invalid', enumProp);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Must be one of the allowed values');
      });
    });

    describe('number validation', () => {
      it('should validate minimum', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'number',
          required: false,
          minimum: 0,
        };

        expect(validateSchemaValue(-1, prop).valid).toBe(false);
        expect(validateSchemaValue(-1, prop).error).toBe('Minimum value is 0');
        expect(validateSchemaValue(0, prop).valid).toBe(true);
      });

      it('should validate maximum', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'number',
          required: false,
          maximum: 100,
        };

        expect(validateSchemaValue(101, prop).valid).toBe(false);
        expect(validateSchemaValue(101, prop).error).toBe('Maximum value is 100');
        expect(validateSchemaValue(100, prop).valid).toBe(true);
      });

      it('should validate multipleOf', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'number',
          required: false,
          multipleOf: 5,
        };

        expect(validateSchemaValue(7, prop).valid).toBe(false);
        expect(validateSchemaValue(7, prop).error).toBe('Must be a multiple of 5');
        expect(validateSchemaValue(10, prop).valid).toBe(true);
      });

      it('should fail for non-number value', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'number',
          required: false,
        };

        expect(validateSchemaValue('not a number', prop).valid).toBe(false);
        expect(validateSchemaValue('not a number', prop).error).toBe('Must be a number');
      });

      it('should fail for NaN', () => {
        const prop: ParsedSchemaProperty = {
          name: 'field',
          type: 'number',
          required: false,
        };

        expect(validateSchemaValue(NaN, prop).valid).toBe(false);
      });
    });

    describe('integer validation', () => {
      const intProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'integer',
        required: false,
      };

      it('should accept integers', () => {
        expect(validateSchemaValue(42, intProp).valid).toBe(true);
        expect(validateSchemaValue(0, intProp).valid).toBe(true);
        expect(validateSchemaValue(-5, intProp).valid).toBe(true);
      });

      it('should reject non-integers', () => {
        const result = validateSchemaValue(3.14, intProp);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Must be an integer');
      });
    });

    describe('boolean validation', () => {
      const boolProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'boolean',
        required: false,
      };

      it('should accept boolean values', () => {
        expect(validateSchemaValue(true, boolProp).valid).toBe(true);
        expect(validateSchemaValue(false, boolProp).valid).toBe(true);
      });

      it('should reject non-boolean values', () => {
        expect(validateSchemaValue('true', boolProp).valid).toBe(false);
        expect(validateSchemaValue(1, boolProp).valid).toBe(false);
      });
    });

    describe('array validation', () => {
      const arrayProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'array',
        required: false,
      };

      it('should accept valid JSON array string', () => {
        expect(validateSchemaValue('["a", "b"]', arrayProp).valid).toBe(true);
      });

      it('should reject invalid JSON', () => {
        const result = validateSchemaValue('not json', arrayProp);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid JSON');
      });
    });

    describe('object validation', () => {
      const objProp: ParsedSchemaProperty = {
        name: 'field',
        type: 'object',
        required: false,
      };

      it('should accept valid JSON object string', () => {
        expect(validateSchemaValue('{"key": "value"}', objProp).valid).toBe(true);
      });

      it('should reject invalid JSON', () => {
        const result = validateSchemaValue('not json', objProp);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid JSON');
      });
    });
  });

  describe('formatValueForInput', () => {
    it('should return empty string for undefined', () => {
      expect(formatValueForInput(undefined, 'string')).toBe('');
    });

    it('should return empty string for null', () => {
      expect(formatValueForInput(null, 'string')).toBe('');
    });

    it('should format arrays as JSON', () => {
      const arr = ['item1', 'item2'];
      const result = formatValueForInput(arr, 'array');
      expect(result).toBe(JSON.stringify(arr, null, 2));
    });

    it('should format objects as JSON', () => {
      const obj = { key: 'value' };
      const result = formatValueForInput(obj, 'object');
      expect(result).toBe(JSON.stringify(obj, null, 2));
    });

    it('should keep JSON strings as-is for arrays', () => {
      const jsonStr = '["item1", "item2"]';
      expect(formatValueForInput(jsonStr, 'array')).toBe(jsonStr);
    });

    it('should keep JSON strings as-is for objects', () => {
      const jsonStr = '{"key": "value"}';
      expect(formatValueForInput(jsonStr, 'object')).toBe(jsonStr);
    });

    it('should convert to string for primitives', () => {
      expect(formatValueForInput(42, 'number')).toBe('42');
      expect(formatValueForInput(true, 'boolean')).toBe('true');
      expect(formatValueForInput('hello', 'string')).toBe('hello');
    });
  });

  describe('getPlaceholder', () => {
    it('should show default value when present', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'string',
        required: false,
        default: 'default value',
      };

      expect(getPlaceholder(prop)).toBe('Default: default value');
    });

    it('should show JSON default for arrays', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'array',
        required: false,
        default: ['a', 'b'],
      };

      expect(getPlaceholder(prop)).toBe('Default: ["a","b"]');
    });

    it('should show JSON default for objects', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'object',
        required: false,
        default: { key: 'value' },
      };

      expect(getPlaceholder(prop)).toBe('Default: {"key":"value"}');
    });

    it('should return string placeholder when no default', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'string',
        required: false,
      };

      expect(getPlaceholder(prop)).toBe('Enter text...');
    });

    it('should return number placeholder', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'number',
        required: false,
      };

      expect(getPlaceholder(prop)).toBe('Enter number...');
    });

    it('should return integer placeholder', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'integer',
        required: false,
      };

      expect(getPlaceholder(prop)).toBe('Enter number...');
    });

    it('should return array placeholder', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'array',
        required: false,
      };

      expect(getPlaceholder(prop)).toBe('Enter JSON array, e.g., ["item1", "item2"]');
    });

    it('should return object placeholder', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'object',
        required: false,
      };

      expect(getPlaceholder(prop)).toBe('Enter JSON object, e.g., {"key": "value"}');
    });

    it('should return enum placeholder', () => {
      const prop: ParsedSchemaProperty = {
        name: 'field',
        type: 'enum',
        required: false,
        enumValues: ['option1', 'option2'],
      };

      expect(getPlaceholder(prop)).toBe('Select an option...');
    });
  });
});
