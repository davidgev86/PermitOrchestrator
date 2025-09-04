import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { JurisdictionPack, FeeDef, InspectionDef } from '../../packages/jp-core/types';

const JP_BASE_PATH = path.resolve(process.cwd(), 'packages/jp-core/jurisdictions');

export async function loadJurisdictionPack(ahjKey: string): Promise<JurisdictionPack> {
  const jpPath = path.join(JP_BASE_PATH, ahjKey);
  
  try {
    // Load manifest
    const manifestPath = path.join(jpPath, 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Load permit types
    const permitTypesPath = path.join(jpPath, 'permit_types.json');
    const permitTypesContent = await fs.readFile(permitTypesPath, 'utf-8');
    const permitTypes = JSON.parse(permitTypesContent);

    // Load fees from YAML
    const fees = await loadFeesYaml(jpPath);

    // Load inspections from YAML
    const inspections = await loadInspectionsYaml(jpPath);

    return {
      id: manifest.id,
      name: manifest.name,
      coverage: manifest.coverage,
      portal: manifest.portal,
      permitTypes,
      fees,
      inspections
    };
  } catch (error) {
    throw new Error(`Failed to load jurisdiction pack: ${ahjKey}`);
  }
}

async function loadFeesYaml(jpPath: string): Promise<FeeDef[]> {
  try {
    const feesPath = path.join(jpPath, 'fees.yaml');
    const feesContent = await fs.readFile(feesPath, 'utf-8');
    const feesData = yaml.load(feesContent) as any;
    
    const fees: FeeDef[] = [];
    
    if (feesData?.fee_schedules?.v2025) {
      const schedule = feesData.fee_schedules.v2025;
      
      // Add base fees
      if (schedule.base_fees) {
        Object.entries(schedule.base_fees).forEach(([key, amount]) => {
          fees.push({
            id: `base_${key}`,
            name: `Base Fee: ${key.replace(/_/g, ' ')}`,
            amount: amount as number,
            conditions: { permitType: key }
          });
        });
      }
      
      // Add valuation fees
      if (schedule.valuation_fees) {
        schedule.valuation_fees.forEach((tier: any, index: number) => {
          fees.push({
            id: `valuation_tier_${index}`,
            name: `Valuation Fee Tier ${index + 1}`,
            amount: 0, // Will be calculated based on rate
            conditions: { 
              valuationRange: tier.range,
              rate: tier.rate
            }
          });
        });
      }
      
      // Add additional fees
      if (schedule.additional_fees) {
        Object.entries(schedule.additional_fees).forEach(([key, amount]) => {
          fees.push({
            id: `additional_${key}`,
            name: `Additional Fee: ${key.replace(/_/g, ' ')}`,
            amount: amount as number,
            conditions: { feeType: key }
          });
        });
      }
    }
    
    return fees;
  } catch (error) {
    console.warn(`Failed to load fees.yaml for ${jpPath}:`, error);
    return [];
  }
}

async function loadInspectionsYaml(jpPath: string): Promise<InspectionDef[]> {
  try {
    const inspectionsPath = path.join(jpPath, 'inspections.yaml');
    const inspectionsContent = await fs.readFile(inspectionsPath, 'utf-8');
    const inspectionsData = yaml.load(inspectionsContent) as any;
    
    const inspections: InspectionDef[] = [];
    
    if (inspectionsData?.inspection_types) {
      inspectionsData.inspection_types.forEach((inspection: any) => {
        inspections.push({
          type: inspection.type,
          label: inspection.label,
          prerequisites: inspection.prerequisites || [],
          schedulingWindow: inspection.scheduling_window ? {
            minDaysOut: inspection.scheduling_window.min_days_out,
            maxDaysOut: inspection.scheduling_window.max_days_out,
            availableDays: inspection.scheduling_window.available_days
          } : undefined
        });
      });
    }
    
    return inspections;
  } catch (error) {
    console.warn(`Failed to load inspections.yaml for ${jpPath}:`, error);
    return [];
  }
}

export async function listAvailableJurisdictions(): Promise<string[]> {
  try {
    const items = await fs.readdir(JP_BASE_PATH, { withFileTypes: true });
    const jurisdictions: string[] = [];

    for (const item of items) {
      if (item.isDirectory()) {
        const statePath = path.join(JP_BASE_PATH, item.name);
        const stateItems = await fs.readdir(statePath, { withFileTypes: true });
        
        for (const stateItem of stateItems) {
          if (stateItem.isDirectory()) {
            const countyPath = path.join(statePath, stateItem.name);
            const countyItems = await fs.readdir(countyPath, { withFileTypes: true });
            
            for (const countyItem of countyItems) {
              if (countyItem.isDirectory()) {
                const jpKey = `${item.name}/${stateItem.name}/${countyItem.name}`;
                jurisdictions.push(jpKey);
              }
            }
          }
        }
      }
    }

    return jurisdictions;
  } catch (error) {
    return [];
  }
}
