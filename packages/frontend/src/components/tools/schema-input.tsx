/**
 * SchemaInput Component
 *
 * WHY: Schema-aware form input that renders appropriate UI based on JSON Schema.
 * Handles strings, numbers, booleans, enums, arrays, and objects with proper validation.
 *
 * FEATURES:
 * - Automatic input type selection based on schema
 * - Validation on blur with visual feedback
 * - Default value pre-population
 * - Constraint enforcement (min/max, length, pattern)
 * - Type conversion before submission
 *
 * USAGE:
 * ```tsx
 * <SchemaInput
 *   property={parsedProperty}
 *   value={currentValue}
 *   onChange={handleValueChange}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  type ParsedSchemaProperty,
  validateSchemaValue,
  formatValueForInput,
  getPlaceholder,
} from '@/lib/jsonSchemaHelpers';
import { cn } from '@/lib/utils';

export interface SchemaInputProps {
  property: ParsedSchemaProperty;
  value: unknown;
  onChange: (value: unknown) => void;
  className?: string;
}

export function SchemaInput({ property, value, onChange, className }: SchemaInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  // Initialize with default value or current value
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatValueForInput(value, property.type));
    } else if (property.default !== undefined && property.default !== null) {
      const defaultStr = formatValueForInput(property.default, property.type);
      setDisplayValue(defaultStr);
      onChange(property.default);
    }
  }, [property.default]); // Only run on mount or when default changes

  // Validate on blur
  const handleBlur = () => {
    setTouched(true);
    const validation = validateSchemaValue(value, property);
    setError(validation.error);
  };

  // Handle text/number input change
  const handleInputChange = (newValue: string) => {
    setDisplayValue(newValue);

    // Convert to appropriate type and propagate
    let convertedValue: unknown;
    if (property.type === 'number' || property.type === 'integer') {
      const num = Number(newValue);
      convertedValue = newValue === '' || isNaN(num) ? undefined : num;
    } else if (property.type === 'array' || property.type === 'object') {
      // For JSON types, store as string until valid
      convertedValue = newValue;
    } else {
      convertedValue = newValue === '' ? undefined : newValue;
    }

    onChange(convertedValue);
  };

  // Handle boolean switch change
  const handleSwitchChange = (checked: boolean) => {
    setDisplayValue(String(checked));
    onChange(checked);
  };

  // Handle enum/combobox change
  const handleComboboxChange = (selected: string) => {
    setDisplayValue(selected);
    onChange(selected);
  };

  // Render the appropriate input based on type
  const renderInput = () => {
    const showError = touched && error;

    switch (property.type) {
      case 'boolean':
        return (
          <>
            <div className="flex items-center gap-3 mt-1">
              <Switch
                id={property.name}
                checked={value === true || value === 'true'}
                onCheckedChange={handleSwitchChange}
                onBlur={handleBlur}
              />
            </div>
            {property.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</p>
            )}
          </>
        );

      case 'enum':
        { if (!property.enumValues || property.enumValues.length === 0) {
          return <p className="text-sm text-red-500">No enum values defined</p>;
        }

        const options: ComboboxOption[] = property.enumValues.map((enumValue) => ({
          value: enumValue,
          label: enumValue,
        }));

        return (
          <>
            <Combobox
              options={options}
              value={displayValue}
              onValueChange={handleComboboxChange}
              placeholder={getPlaceholder(property)}
              searchPlaceholder="Search options..."
              className={cn('mt-1', showError && 'border-red-500')}
            />
            {showError && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {property.description && !showError && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</p>
            )}
          </>
        ); }

      case 'array':
      case 'object':
        return (
          <>
            <Textarea
              id={property.name}
              value={displayValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={getPlaceholder(property)}
              className={cn('mt-1 font-mono text-xs', showError && 'border-red-500')}
              rows={6}
            />
            {showError && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {property.description && !showError && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Enter valid JSON {property.type === 'array' ? 'array' : 'object'}
            </p>
          </>
        );

      case 'number':
      case 'integer':
        return (
          <>
            <Input
              id={property.name}
              type="number"
              value={displayValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={getPlaceholder(property)}
              min={property.minimum}
              max={property.maximum}
              step={property.type === 'integer' ? 1 : property.multipleOf || 'any'}
              className={cn('mt-1', showError && 'border-red-500')}
            />
            {showError && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {property.description && !showError && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</p>
            )}
            {(property.minimum !== undefined || property.maximum !== undefined) && !showError && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {property.minimum !== undefined && property.maximum !== undefined
                  ? `Range: ${property.minimum} - ${property.maximum}`
                  : property.minimum !== undefined
                    ? `Min: ${property.minimum}`
                    : `Max: ${property.maximum}`}
              </p>
            )}
          </>
        );

      case 'string':
      default:
        return (
          <>
            <Input
              id={property.name}
              type="text"
              value={displayValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={getPlaceholder(property)}
              maxLength={property.maxLength}
              className={cn('mt-1', showError && 'border-red-500')}
            />
            {showError && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {property.description && !showError && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{property.description}</p>
            )}
            {property.maxLength && !showError && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Max length: {property.maxLength}
              </p>
            )}
          </>
        );
    }
  };

  return (
    <div className={className}>
      <Label htmlFor={property.name} className="text-xs">
        {property.name}
        {property.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
    </div>
  );
}
