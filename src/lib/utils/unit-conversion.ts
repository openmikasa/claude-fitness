/**
 * Unit conversion utilities for weight measurements
 *
 * Database always stores weights in kg
 * Display and input conversions use user's preferred unit
 */

export const CONVERSION_RATES = {
  LB_TO_KG: 0.453592,
  KG_TO_LB: 2.20462,
} as const;

export type WeightUnit = 'kg' | 'lb';
export type UserUnitPreference = 'metric' | 'imperial';

/**
 * Convert weight between units
 */
export function convertWeight(
  weight: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number {
  if (fromUnit === toUnit) return weight;

  if (fromUnit === 'lb' && toUnit === 'kg') {
    return weight * CONVERSION_RATES.LB_TO_KG;
  }

  return weight * CONVERSION_RATES.KG_TO_LB;
}

/**
 * Display weight in user's preferred unit
 * Assumes database stores weights in kg
 */
export function displayWeight(
  weightInKg: number,
  userPreference: UserUnitPreference
): { value: number; unit: string } {
  if (userPreference === 'imperial') {
    return {
      value: Math.round(weightInKg * CONVERSION_RATES.KG_TO_LB * 10) / 10,
      unit: 'lb',
    };
  }
  return {
    value: Math.round(weightInKg * 10) / 10,
    unit: 'kg'
  };
}

/**
 * Convert user input to kg for storage
 */
export function inputToKg(
  weight: number,
  userPreference: UserUnitPreference
): number {
  if (userPreference === 'imperial') {
    return weight * CONVERSION_RATES.LB_TO_KG;
  }
  return weight;
}

/**
 * Convert kg to user's input unit (for form initialization)
 */
export function kgToInput(
  weightInKg: number,
  userPreference: UserUnitPreference
): number {
  if (userPreference === 'imperial') {
    return Math.round(weightInKg * CONVERSION_RATES.KG_TO_LB * 10) / 10;
  }
  return Math.round(weightInKg * 10) / 10;
}

/**
 * Get weight unit label for forms
 */
export function getWeightUnitLabel(userPreference: UserUnitPreference): string {
  return userPreference === 'imperial' ? 'lb' : 'kg';
}
