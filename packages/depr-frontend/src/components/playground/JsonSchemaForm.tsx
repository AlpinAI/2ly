import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
}

interface JsonSchemaFormProps {
  schema: JsonSchema;
  onChange: (data: Record<string, unknown>) => void;
  className?: string;
}

/**
 * Generates a dynamic form from a JSON Schema
 * Supports basic types: string, number, boolean, object, array
 * Handles required fields and field descriptions
 */
export function JsonSchemaForm({ schema, onChange, className = '' }: JsonSchemaFormProps): JSX.Element {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, unknown> = {};
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
        if (fieldSchema.default !== undefined) {
          initialData[key] = fieldSchema.default;
        } else if (fieldSchema.type === 'boolean') {
          initialData[key] = false;
        } else if (fieldSchema.type === 'array') {
          initialData[key] = [];
        } else if (fieldSchema.type === 'object') {
          initialData[key] = {};
        }
      });
    }
    setFormData(initialData);
    onChange(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    const newData = { ...formData, [fieldName]: value };
    setFormData(newData);

    // Clear error for this field
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }

    onChange(newData);
  };

  const renderField = (fieldName: string, fieldSchema: JsonSchema): JSX.Element => {
    const isRequired = schema.required?.includes(fieldName) || false;
    const fieldValue = formData[fieldName];
    const fieldError = errors[fieldName];

    return (
      <div key={fieldName} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {fieldName}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        {fieldSchema.description && (
          <p className="text-xs text-gray-500 mb-2">{fieldSchema.description}</p>
        )}

        {renderInput(fieldName, fieldSchema, fieldValue, isRequired)}

        {fieldError && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{fieldError}</span>
          </div>
        )}
      </div>
    );
  };

  const renderInput = (
    fieldName: string,
    fieldSchema: JsonSchema,
    fieldValue: unknown,
    isRequired: boolean,
  ): JSX.Element => {
    const baseInputClasses =
      'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.enum) {
          return (
            <select
              value={String(fieldValue || '')}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              required={isRequired}
              className={baseInputClasses}
            >
              <option value="">Select an option...</option>
              {fieldSchema.enum.map((option) => (
                <option key={String(option)} value={String(option)}>
                  {String(option)}
                </option>
              ))}
            </select>
          );
        }

        return (
          <input
            type="text"
            value={String(fieldValue || '')}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            required={isRequired}
            placeholder={fieldSchema.default ? String(fieldSchema.default) : ''}
            className={baseInputClasses}
          />
        );

      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={Number(fieldValue || 0)}
            onChange={(e) => handleFieldChange(fieldName, parseFloat(e.target.value))}
            required={isRequired}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.type === 'integer' ? 1 : 'any'}
            className={baseInputClasses}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(fieldValue)}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              {fieldSchema.description || 'Enable this option'}
            </span>
          </label>
        );

      case 'array':
        return (
          <textarea
            value={JSON.stringify(fieldValue || [], null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (Array.isArray(parsed)) {
                  handleFieldChange(fieldName, parsed);
                }
              } catch {
                // Invalid JSON, don't update
              }
            }}
            required={isRequired}
            rows={4}
            placeholder="[]"
            className={baseInputClasses + ' font-mono text-xs'}
          />
        );

      case 'object':
        return (
          <textarea
            value={JSON.stringify(fieldValue || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                  handleFieldChange(fieldName, parsed);
                }
              } catch {
                // Invalid JSON, don't update
              }
            }}
            required={isRequired}
            rows={4}
            placeholder="{}"
            className={baseInputClasses + ' font-mono text-xs'}
          />
        );

      default:
        // Fallback for unknown types - treat as string
        return (
          <input
            type="text"
            value={String(fieldValue || '')}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            required={isRequired}
            className={baseInputClasses}
          />
        );
    }
  };

  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
        No input parameters required for this tool
      </div>
    );
  }

  return (
    <div className={className}>
      {Object.entries(schema.properties).map(([fieldName, fieldSchema]) =>
        renderField(fieldName, fieldSchema),
      )}
    </div>
  );
}