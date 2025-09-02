import { promises as fs } from 'fs';
import path from 'path';
import { JurisdictionPack } from '../../packages/jp-core/types';

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

    // Load fees (simplified - in real implementation would parse YAML)
    const fees = []; // TODO: Load from fees.yaml

    // Load inspections (simplified - in real implementation would parse YAML)
    const inspections = []; // TODO: Load from inspections.yaml

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
