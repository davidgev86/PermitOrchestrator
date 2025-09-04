import { describe, it, expect, beforeEach } from 'vitest';
import { FeeCalculator } from '../../server/services/fee-calculator';
import { JurisdictionPack, FeeDef } from '../../packages/jp-core/types';

describe('FeeCalculator', () => {
  let calculator: FeeCalculator;
  let mockJP: JurisdictionPack;

  beforeEach(() => {
    mockJP = {
      id: 'test-jp',
      name: 'Test Jurisdiction',
      coverage: {
        state: 'MD',
        county: 'Test County'
      },
      portal: {
        kind: 'none'
      },
      permitTypes: {},
      fees: [
        {
          id: 'base_residential_kitchen_remodel',
          name: 'Base Fee: Residential Kitchen Remodel',
          amount: 125,
          conditions: { permitType: 'residential_kitchen_remodel' }
        },
        {
          id: 'valuation_tier_0',
          name: 'Valuation Fee Tier 1',
          amount: 0,
          conditions: { 
            valuationRange: [0, 10000],
            rate: 0.015
          }
        },
        {
          id: 'valuation_tier_1',
          name: 'Valuation Fee Tier 2',
          amount: 0,
          conditions: { 
            valuationRange: [10001, 50000],
            rate: 0.020
          }
        },
        {
          id: 'additional_plan_review',
          name: 'Additional Fee: Plan Review',
          amount: 75,
          conditions: { feeType: 'plan_review' }
        },
        {
          id: 'additional_inspection_fee',
          name: 'Additional Fee: Inspection Fee',
          amount: 50,
          conditions: { feeType: 'inspection_fee' }
        }
      ] as FeeDef[],
      inspections: []
    };

    calculator = new FeeCalculator(mockJP);
  });

  describe('calculateFees', () => {
    it('should calculate basic fees correctly', () => {
      const formData = {
        propertyAddress: '123 Main Street',
        valuationUSD: 5000,
        attachments: {
          plans: 'plan-file.pdf'
        }
      };

      const result = calculator.calculateFees(formData, 'residential_kitchen_remodel');

      expect(result.errors).toHaveLength(0);
      expect(result.totalFee).toBe(325); // 125 (base) + 75 (valuation at 1.5%) + 75 (plan review) + 50 (inspection)
      expect(result.breakdown).toHaveLength(4);
    });

    it('should calculate valuation fees in correct tier', () => {
      const formData = {
        valuationUSD: 25000, // Should hit tier 2 (2.0% rate)
        attachments: {}
      };

      const result = calculator.calculateFees(formData, 'residential_kitchen_remodel');

      const valuationFee = result.breakdown.find(fee => fee.feeId === 'valuation_tier_1');
      expect(valuationFee).toBeDefined();
      expect(valuationFee!.amount).toBe(500); // 25000 * 0.02 = 500
      expect(valuationFee!.calculation).toContain('$25,000 × 2% = $500');
    });

    it('should apply plan review fee when plans are attached', () => {
      const formData = {
        attachments: {
          plans: 'plan-file.pdf'
        }
      };

      const result = calculator.calculateFees(formData, 'residential_kitchen_remodel');

      const planReviewFee = result.breakdown.find(fee => fee.feeId === 'additional_plan_review');
      expect(planReviewFee).toBeDefined();
      expect(planReviewFee!.amount).toBe(75);
    });

    it('should not apply plan review fee when no plans attached', () => {
      const formData = {
        attachments: {}
      };

      const result = calculator.calculateFees(formData, 'residential_kitchen_remodel');

      const planReviewFee = result.breakdown.find(fee => fee.feeId === 'additional_plan_review');
      expect(planReviewFee).toBeUndefined();
    });

    it('should always apply inspection fee', () => {
      const formData = {
        attachments: {}
      };

      const result = calculator.calculateFees(formData, 'residential_kitchen_remodel');

      const inspectionFee = result.breakdown.find(fee => fee.feeId === 'additional_inspection_fee');
      expect(inspectionFee).toBeDefined();
      expect(inspectionFee!.amount).toBe(50);
    });

    it('should handle missing valuation gracefully', () => {
      const formData = {
        attachments: {}
      };

      const result = calculator.calculateFees(formData, 'residential_kitchen_remodel');

      expect(result.errors).toHaveLength(0);
      // Should still have base fee and inspection fee
      expect(result.totalFee).toBe(175); // 125 (base) + 50 (inspection)
    });
  });
});