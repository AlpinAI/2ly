/**
 * JSON Schema Helpers
 *
 * WHY: Utilities for parsing, validating, and working with JSON Schema Draft 7.
 * Used by SchemaInput to generate form fields and validate tool inputs.
 *
 * FEATURES:
 * - Parse JSON Schema to extract field metadata
 * - Validate values against schema constraints
 * - Convert between JSON types and form input values
 * - Handle nested objects and arrays
 */

/**
 * JSON Schema Draft 7 property type
 */
export interface JSONSchemaProperty {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  description?: string;
  default?: unknown;
  enum?: string[];

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Number constraints
  minimum?: number;
  maximum?: number;
  multipleOf?: number;

  // Array constraints
  items?: JSONSchemaProperty | JSONSchemaProperty[];
  minItems?: number;
  maxItems?: number;

  // Object constraints
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchemaProperty;
}

/**
 * Parsed schema property with metadata for form rendering
 */
export interface ParsedSchemaProperty {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'enum';
  description?: string;
  required: boolean;
  default?: unknown;

  // Enum-specific
  enumValues?: string[];

  // Number-specific
  minimum?: number;
  maximum?: number;
  multipleOf?: number;

  // String-specific
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Array/Object-specific
  schema?: JSONSchemaProperty;
}

/**
 * Parse JSON Schema string and extract properties for form generation
 */
export function parseJSONSchema(schemaString: string): ParsedSchemaProperty[] {
  try {
    const schema = JSON.parse(schemaString) as {
      type?: string;
      properties?: Record<string, JSONSchemaProperty>;
      required?: string[];
    };

    if (!schema.properties) {
      return [];
    }

    const required = schema.required || [];

    return Object.entries(schema.properties).map(([name, prop]) => {
      const parsedProp: ParsedSchemaProperty = {
        name,
        type: determineInputType(prop),
        description: prop.description,
        required: required.includes(name),
        default: prop.default,
      };

      // Add enum values
      if (prop.enum) {
        parsedProp.enumValues = prop.enum;
      }

      // Add number constraints
      if (prop.type === 'number' || prop.type === 'integer') {
        parsedProp.minimum = prop.minimum;
        parsedProp.maximum = prop.maximum;
        parsedProp.multipleOf = prop.multipleOf;
      }

      // Add string constraints
      if (prop.type === 'string') {
        parsedProp.minLength = prop.minLength;
        parsedProp.maxLength = prop.maxLength;
        parsedProp.pattern = prop.pattern;
        parsedProp.format = prop.format;
      }

      // Store full schema for arrays and objects (for JSON editor)
      if (prop.type === 'array' || prop.type === 'object') {
        parsedProp.schema = prop;
      }

      return parsedProp;
    });
  } catch (error) {
    console.error('Failed to parse JSON schema:', error);
    return [];
  }
}

/**
 * Determine the appropriate input type based on JSON Schema property
 */
function determineInputType(prop: JSONSchemaProperty): ParsedSchemaProperty['type'] {
  // Enum has priority
  if (prop.enum && prop.enum.length > 0) {
    return 'enum';
  }

  // Use explicit type
  if (prop.type) {
    return prop.type as ParsedSchemaProperty['type'];
  }

  // Default to string
  return 'string';
}

/**
 * Convert form input value to proper JSON type based on schema
 */
export function convertValueToType(
  value: unknown,
  type: ParsedSchemaProperty['type']
): unknown {
  // Handle empty or null values
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  switch (type) {
    case 'boolean':
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === true;

    case 'number':
    case 'integer':
      { if (typeof value === 'number') return value;
      const num = Number(value);
      return isNaN(num) ? undefined : num; }

    case 'array':
    case 'object':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
      return value;

    case 'string':
    case 'enum':
    default:
      return String(value);
  }
}

/**
 * Validate a value against JSON Schema constraints
 */
export function validateSchemaValue(
  value: unknown,
  prop: ParsedSchemaProperty
): { valid: boolean; error?: string } {
  // Required check
  if (prop.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: 'This field is required' };
  }

  // Skip validation for optional empty values
  if (!prop.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Type-specific validation
  switch (prop.type) {
    case 'string':
    case 'enum':
      return validateString(value as string, prop);

    case 'number':
    case 'integer':
      return validateNumber(value as number, prop);

    case 'boolean':
      return { valid: typeof value === 'boolean' };

    case 'array':
    case 'object':
      return validateJSON(value as string);

    default:
      return { valid: true };
  }
}

/**
 * Validate string value against constraints
 */
function validateString(
  value: string,
  prop: ParsedSchemaProperty
): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Must be a string' };
  }

  if (prop.minLength !== undefined && value.length < prop.minLength) {
    return { valid: false, error: `Minimum length is ${prop.minLength}` };
  }

  if (prop.maxLength !== undefined && value.length > prop.maxLength) {
    return { valid: false, error: `Maximum length is ${prop.maxLength}` };
  }

  if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
    return { valid: false, error: 'Invalid format' };
  }

  if (prop.enumValues && !prop.enumValues.includes(value)) {
    return { valid: false, error: 'Must be one of the allowed values' };
  }

  return { valid: true };
}

/**
 * Validate number value against constraints
 */
function validateNumber(
  value: number,
  prop: ParsedSchemaProperty
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Must be a number' };
  }

  if (prop.type === 'integer' && !Number.isInteger(value)) {
    return { valid: false, error: 'Must be an integer' };
  }

  if (prop.minimum !== undefined && value < prop.minimum) {
    return { valid: false, error: `Minimum value is ${prop.minimum}` };
  }

  if (prop.maximum !== undefined && value > prop.maximum) {
    return { valid: false, error: `Maximum value is ${prop.maximum}` };
  }

  if (prop.multipleOf !== undefined && value % prop.multipleOf !== 0) {
    return { valid: false, error: `Must be a multiple of ${prop.multipleOf}` };
  }

  return { valid: true };
}

/**
 * Validate JSON string
 */
function validateJSON(value: string): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Must be valid JSON' };
  }

  try {
    JSON.parse(value);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON',
    };
  }
}

/**
 * Format a value for display in a form input
 */
export function formatValueForInput(value: unknown, type: ParsedSchemaProperty['type']): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (type === 'array' || type === 'object') {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  return String(value);
}

/**
 * Get placeholder text based on schema property
 */
export function getPlaceholder(prop: ParsedSchemaProperty): string {
  if (prop.default !== undefined) {
    if (prop.type === 'array' || prop.type === 'object') {
      return `Default: ${JSON.stringify(prop.default)}`;
    }
    return `Default: ${prop.default}`;
  }

  switch (prop.type) {
    case 'string':
      return 'Enter text...';
    case 'number':
    case 'integer':
      return 'Enter number...';
    case 'array':
      return 'Enter JSON array, e.g., ["item1", "item2"]';
    case 'object':
      return 'Enter JSON object, e.g., {"key": "value"}';
    case 'enum':
      return 'Select an option...';
    default:
      return '';
  }
}
