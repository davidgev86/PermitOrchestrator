import { describe, it, expect, beforeEach } from 'vitest';
import { FormValidator } from '../../server/services/validation';
import { JurisdictionPack, FieldRule } from '../../packages/jp-core/types';

describe('FormValidator', () => {
  let validator: FormValidator;
  let mockJP: JurisdictionPack;

  beforeEach(() => {
    mockJP = {
      id: 'test-jp',
      name: 'Test Jurisdiction',
      coverage: {
        state: 'MD',
        county: 'Test County',
        city: 'Test City'
      },
      portal: {
        kind: 'none'
      },
      permitTypes: {
        'residential_kitchen_remodel': {
          label: 'Residential Kitchen Remodel',
          forms: ['application'],
          submission: {
            method: 'portal',
            feeSchedule: 'v2025'
          },
          fields: {
            propertyAddress: {
              required: true,
              min: 10,
              max: 200
            } as FieldRule,
            valuationUSD: {
              required: true,
              min: 1000,
              max: 1000000
            } as FieldRule,
            contractorLicense: {
              required: false,
              pattern: '^[A-Z0-9]{8,12}$'
            } as FieldRule
          },
          attachments: ['plans', 'permit_application']
        }
      },
      fees: [],
      inspections: []
    };

    validator = new FormValidator(mockJP);
  });

  describe('validateForm', () => {
    it('should validate a complete valid form', () => {
      const formData = {
        propertyAddress: '123 Main Street, Anytown, ST 12345',
        valuationUSD: 15000,
        contractorLicense: 'ABC12345',
        attachments: {
          plans: 'plan-file.pdf',
          permit_application: 'application.pdf'
        }
      };

      const result = validator.validateForm(formData, 'residential_kitchen_remodel');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const formData = {
        propertyAddress: '', // Empty required field
        // valuationUSD missing
        attachments: {}
      };

      const result = validator.validateForm(formData, 'residential_kitchen_remodel');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4); // 2 missing fields + 2 missing attachments
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('REQUIRED_FIELD');
      expect(errorCodes).toContain('MISSING_ATTACHMENT');
    });

    it('should validate field constraints', () => {
      const formData = {
        propertyAddress: '123 Main', // Too short (min: 10)
        valuationUSD: 500, // Too low (min: 1000)
        contractorLicense: 'invalid-format', // Invalid pattern
        attachments: {
          plans: 'plan-file.pdf',
          permit_application: 'application.pdf'
        }
      };

      const result = validator.validateForm(formData, 'residential_kitchen_remodel');

      expect(result.isValid).toBe(false);
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('MIN_LENGTH');
      expect(errorCodes).toContain('MIN_VALUE');
      expect(errorCodes).toContain('INVALID_FORMAT');
    });

    it('should fail for invalid permit type', () => {
      const formData = {};
      
      const result = validator.validateForm(formData, 'invalid_permit_type');

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_PERMIT_TYPE');
    });

    it('should generate warnings for edge cases', () => {
      const formData = {
        propertyAddress: '123 Main Street, Anytown, ST 12345',
        valuationUSD: 999, // Low valuation
        attachments: {
          plans: 'plan-file.pdf',
          permit_application: 'application.pdf'
        }
      };

      const result = validator.validateForm(formData, 'residential_kitchen_remodel');

      expect(result.warnings).toContain('Low valuation amount may require additional documentation');
    });
  });
});