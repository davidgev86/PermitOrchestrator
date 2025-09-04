import { JurisdictionPack, FeeDef } from '../../packages/jp-core/types';

export interface FeeCalculation {
  totalFee: number;
  breakdown: FeeBreakdownItem[];
  errors: string[];
}

export interface FeeBreakdownItem {
  feeId: string;
  name: string;
  amount: number;
  calculation?: string;
}

export class FeeCalculator {
  constructor(private jp: JurisdictionPack) {}

  calculateFees(formData: Record<string, any>, permitType: string): FeeCalculation {
    const breakdown: FeeBreakdownItem[] = [];
    const errors: string[] = [];
    let totalFee = 0;

    try {
      // Calculate base fees
      const baseFees = this.jp.fees.filter(fee => 
        fee.conditions?.permitType === permitType
      );

      baseFees.forEach(fee => {
        breakdown.push({
          feeId: fee.id,
          name: fee.name,
          amount: fee.amount
        });
        totalFee += fee.amount;
      });

      // Calculate valuation-based fees
      if (formData.valuationUSD) {
        const valuationFees = this.calculateValuationFees(formData.valuationUSD);
        breakdown.push(...valuationFees);
        totalFee += valuationFees.reduce((sum, fee) => sum + fee.amount, 0);
      }

      // Calculate additional fees
      const additionalFees = this.jp.fees.filter(fee => 
        fee.conditions?.feeType && this.shouldApplyAdditionalFee(fee, formData)
      );

      additionalFees.forEach(fee => {
        breakdown.push({
          feeId: fee.id,
          name: fee.name,
          amount: fee.amount
        });
        totalFee += fee.amount;
      });

    } catch (error) {
      errors.push(`Error calculating fees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      totalFee,
      breakdown,
      errors
    };
  }

  private calculateValuationFees(valuationUSD: number): FeeBreakdownItem[] {
    const valuationTiers = this.jp.fees.filter(fee => 
      fee.conditions?.valuationRange && fee.conditions?.rate
    );

    const applicableTier = valuationTiers.find(fee => {
      const range = fee.conditions!.valuationRange as [number, number | null];
      const [min, max] = range;
      return valuationUSD >= min && (max === null || valuationUSD <= max);
    });

    if (!applicableTier) {
      return [];
    }

    const rate = applicableTier.conditions!.rate as number;
    const calculatedFee = Math.round(valuationUSD * rate);

    return [{
      feeId: applicableTier.id,
      name: `Valuation Fee (${rate * 100}%)`,
      amount: calculatedFee,
      calculation: `$${valuationUSD.toLocaleString()} × ${rate * 100}% = $${calculatedFee.toLocaleString()}`
    }];
  }

  private shouldApplyAdditionalFee(fee: FeeDef, formData: Record<string, any>): boolean {
    const feeType = fee.conditions?.feeType as string;

    switch (feeType) {
      case 'plan_review':
        // Apply plan review fee if plans are submitted
        return !!formData.attachments?.plans;
      
      case 'inspection_fee':
        // Apply inspection fee for all permits
        return true;
      
      default:
        return false;
    }
  }
}

export function createFeeCalculator(jp: JurisdictionPack): FeeCalculator {
  return new FeeCalculator(jp);
}