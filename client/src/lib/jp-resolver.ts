interface LocationInput {
  city: string;
  state: string;
}

export function resolveAHJ(location: LocationInput): string {
  const { city, state } = location;
  
  // Maryland jurisdiction mapping
  if (state.toLowerCase() === 'md' || state.toLowerCase() === 'maryland') {
    const normalizedCity = city.toLowerCase().trim();
    
    // Incorporated cities have their own AHJs
    if (normalizedCity === 'gaithersburg') {
      return 'us/md/gaithersburg';
    }
    
    if (normalizedCity === 'rockville') {
      return 'us/md/rockville';
    }
    
    // Germantown and other unincorporated areas go to Montgomery County
    if (normalizedCity === 'germantown') {
      return 'us/md/montgomery_county';
    }
    
    // Default to Montgomery County for other areas in Montgomery County
    return 'us/md/montgomery_county';
  }
  
  // Default fallback
  throw new Error(`AHJ resolution not supported for ${city}, ${state}`);
}

export function getJurisdictionName(ahjKey: string): string {
  switch (ahjKey) {
    case 'us/md/gaithersburg':
      return 'City of Gaithersburg, MD';
    case 'us/md/rockville':
      return 'City of Rockville, MD';
    case 'us/md/montgomery_county':
      return 'Montgomery County Department of Permitting Services, MD';
    default:
      return 'Unknown Jurisdiction';
  }
}

export function getJurisdictionPortalInfo(ahjKey: string) {
  switch (ahjKey) {
    case 'us/md/gaithersburg':
      return {
        name: 'City of Gaithersburg',
        portal: 'https://gaithersburg.seamlessdocs.com',
        processingDays: '10-15'
      };
    case 'us/md/rockville':
      return {
        name: 'City of Rockville',
        portal: 'https://rockville.viewpointcloud.com',
        processingDays: '10-12'
      };
    case 'us/md/montgomery_county':
      return {
        name: 'Montgomery County DPS',
        portal: 'https://permits.montgomerycountymd.gov',
        processingDays: '15-20'
      };
    default:
      return {
        name: 'Unknown Jurisdiction',
        portal: '',
        processingDays: '10-20'
      };
  }
}
