import { JurisdictionPack, FieldRule } from '../../packages/jp-core/types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class FormValidator {
  constructor(private jp: JurisdictionPack) {}

  validateForm(formData: Record<string, any>, permitType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const permitTypeDef = this.jp.permitTypes[permitType];
    if (!permitTypeDef) {
      errors.push({
        field: 'permitType',
        message: `Invalid permit type: ${permitType}`,
        code: 'INVALID_PERMIT_TYPE'
      });
      return { isValid: false, errors, warnings };
    }

    // Validate each field according to rules
    Object.entries(permitTypeDef.fields).forEach(([fieldName, rule]) => {
      const value = formData[fieldName];
      const fieldErrors = this.validateField(fieldName, value, rule);
      errors.push(...fieldErrors);
    });

    // Check for required attachments
    const missingAttachments = permitTypeDef.attachments.filter(
      attachment => !formData.attachments?.[attachment]
    );

    missingAttachments.forEach(attachment => {
      errors.push({
        field: `attachments.${attachment}`,
        message: `Required attachment missing: ${attachment}`,
        code: 'MISSING_ATTACHMENT'
      });
    });

    // Add warnings for optional but recommended fields
    if (formData.valuationUSD && formData.valuationUSD < 1000) {
      warnings.push('Low valuation amount may require additional documentation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateField(fieldName: string, value: any, rule: FieldRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      });
      return errors; // Skip other validations if required field is missing
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      return errors;
    }

    // Check minimum value/length
    if (rule.min !== undefined) {
      if (typeof value === 'number' && value < rule.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.min}`,
          code: 'MIN_VALUE'
        });
      }
      if (typeof value === 'string' && value.length < rule.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.min} characters`,
          code: 'MIN_LENGTH'
        });
      }
    }

    // Check maximum value/length
    if (rule.max !== undefined) {
      if (typeof value === 'number' && value > rule.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} cannot exceed ${rule.max}`,
          code: 'MAX_VALUE'
        });
      }
      if (typeof value === 'string' && value.length > rule.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} cannot exceed ${rule.max} characters`,
          code: 'MAX_LENGTH'
        });
      }
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string') {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`,
          code: 'INVALID_FORMAT'
        });
      }
    }

    // Check options
    if (rule.options && rule.options.length > 0) {
      if (!rule.options.includes(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be one of: ${rule.options.join(', ')}`,
          code: 'INVALID_OPTION'
        });
      }
    }

    return errors;
  }
}

export function createValidator(jp: JurisdictionPack): FormValidator {
  return new FormValidator(jp);
}