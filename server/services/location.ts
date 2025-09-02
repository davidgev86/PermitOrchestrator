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
    
    // Default to Montgomery County for other areas (this would be more sophisticated in real implementation)
    return 'us/md/montgomery_county';
  }
  
  // Default fallback
  throw new Error(`AHJ resolution not supported for ${city}, ${state}`);
}

export function validateAddress(address: {
  address1: string;
  city: string;
  state: string;
  postal: string;
}): boolean {
  // Basic address validation
  return !!(
    address.address1.trim() &&
    address.city.trim() &&
    address.state.trim() &&
    address.postal.trim() &&
    /^\d{5}(-\d{4})?$/.test(address.postal)
  );
}
