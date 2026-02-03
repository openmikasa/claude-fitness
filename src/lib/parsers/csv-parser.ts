import Papa from 'papaparse';
import type { CsvRow, ImportPreview } from '@/types/import';
import { convertWeight } from '@/lib/utils/unit-conversion';
import type { WeightUnit } from '@/lib/utils/unit-conversion';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 5000;

export interface ParseResult {
  success: boolean;
  data?: ImportPreview;
  error?: string;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  const validExtensions = ['.csv', '.txt'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return { valid: false, error: 'Please upload a .csv or .txt file' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // Auto-detect
      complete: (results) => {
        // Check for parsing errors
        if (results.errors.length > 0) {
          const errorMessages = results.errors
            .map((err) => `Row ${err.row}: ${err.message}`)
            .join(', ');
          resolve({
            success: false,
            error: `CSV parsing errors: ${errorMessages}`,
          });
          return;
        }

        // Check row count
        if (results.data.length === 0) {
          resolve({
            success: false,
            error: 'CSV file is empty',
          });
          return;
        }

        if (results.data.length > MAX_ROWS) {
          resolve({
            success: false,
            error: `Too many rows. Maximum allowed is ${MAX_ROWS}, found ${results.data.length}`,
          });
          return;
        }

        // Extract headers
        const headers = results.meta.fields || [];
        if (headers.length === 0) {
          resolve({
            success: false,
            error: 'No columns found in CSV file',
          });
          return;
        }

        // Get sample rows (first 10)
        const sampleRows = results.data.slice(0, 10) as CsvRow[];

        resolve({
          success: true,
          data: {
            headers,
            sampleRows,
            totalRows: results.data.length,
          },
        });
      },
      error: (error) => {
        resolve({
          success: false,
          error: `Failed to parse CSV: ${error.message}`,
        });
      },
    });
  });
}

// Auto-detect common column names (weightlifting only)
export function autoDetectMapping(headers: string[]): {
  dateColumn?: string;
  sessionColumn?: string;
  exerciseColumn?: string;
  weightColumn?: string;
  repsColumn?: string;
  setsColumn?: string;
  notesColumn?: string;
} {
  const mapping: Record<string, string | undefined> = {};

  const headerMap = headers.map((h) => h.toLowerCase().trim());

  // Date patterns
  const datePatterns = ['date', 'workout date', 'workout_date', 'day'];
  const dateMatch = headerMap.findIndex((h) =>
    datePatterns.some((p) => h.includes(p))
  );
  if (dateMatch !== -1) mapping.dateColumn = headers[dateMatch];

  // Session patterns (for multiple workouts per day)
  const sessionPatterns = ['session', 'workout', 'workout_name', 'workout name'];
  const sessionMatch = headerMap.findIndex((h) =>
    sessionPatterns.some((p) => h === p) // Exact match to avoid conflicts
  );
  if (sessionMatch !== -1) mapping.sessionColumn = headers[sessionMatch];

  // Exercise patterns
  const exercisePatterns = ['exercise', 'exercise name', 'exercise_name', 'name'];
  const exerciseMatch = headerMap.findIndex((h) =>
    exercisePatterns.some((p) => h.includes(p))
  );
  if (exerciseMatch !== -1) mapping.exerciseColumn = headers[exerciseMatch];

  // Weight patterns
  const weightPatterns = ['weight', 'load', 'kg', 'lbs'];
  const weightMatch = headerMap.findIndex((h) =>
    weightPatterns.some((p) => h.includes(p))
  );
  if (weightMatch !== -1) mapping.weightColumn = headers[weightMatch];

  // Reps patterns
  const repsPatterns = ['reps', 'repetitions', 'rep'];
  const repsMatch = headerMap.findIndex((h) =>
    repsPatterns.some((p) => h.includes(p))
  );
  if (repsMatch !== -1) mapping.repsColumn = headers[repsMatch];

  // Sets patterns
  const setsPatterns = ['sets', 'set'];
  const setsMatch = headerMap.findIndex((h) =>
    setsPatterns.some((p) => h.includes(p))
  );
  if (setsMatch !== -1) mapping.setsColumn = headers[setsMatch];

  // Notes patterns
  const notesPatterns = ['notes', 'note', 'comments', 'comment'];
  const notesMatch = headerMap.findIndex((h) =>
    notesPatterns.some((p) => h.includes(p))
  );
  if (notesMatch !== -1) mapping.notesColumn = headers[notesMatch];

  return mapping;
}

/**
 * Detect weight unit from column name
 * Returns 'kg', 'lb', or null if unit cannot be determined
 */
export function detectWeightUnit(columnName: string): WeightUnit | null {
  const lower = columnName.toLowerCase().trim();

  // Check for explicit unit indicators
  if (lower.includes('kg') || lower.includes('kilo')) {
    return 'kg';
  }

  if (lower.includes('lb') || lower.includes('pound')) {
    return 'lb';
  }

  // Default: cannot determine
  return null;
}

/**
 * Convert weight value to kg for storage and return detected unit
 * Detects unit from cell value or column name, falls back to user preference
 */
export function normalizeWeight(
  rawValue: string,
  columnName: string,
  userPreferredUnit: 'metric' | 'imperial' = 'metric'
): { weight: number; unit: 'kg' | 'lb' } {
  // First try to detect unit from the cell value itself (e.g., "60.0kg" or "45lb")
  const valueUnitMatch = rawValue.match(/(kg|lb|lbs|pound|kilo)/i);
  if (valueUnitMatch) {
    const unit = valueUnitMatch[1].toLowerCase();
    const numericValue = parseFloat(rawValue);

    if (isNaN(numericValue)) {
      return { weight: 0, unit: 'kg' };
    }

    if (unit === 'kg' || unit === 'kilo') {
      return { weight: numericValue, unit: 'kg' };
    } else {
      // lb, lbs, pound
      return { weight: convertWeight(numericValue, 'lb', 'kg'), unit: 'lb' };
    }
  }

  // If no unit in value, try to detect from column name
  const detectedUnit = detectWeightUnit(columnName);
  const numericValue = parseFloat(rawValue);

  if (isNaN(numericValue)) {
    return { weight: 0, unit: 'kg' };
  }

  if (detectedUnit) {
    const weightInKg = detectedUnit === 'kg' ? numericValue : convertWeight(numericValue, 'lb', 'kg');
    return { weight: weightInKg, unit: detectedUnit };
  }

  // Fall back to user preference if no unit detected
  const fromUnit: WeightUnit = userPreferredUnit === 'imperial' ? 'lb' : 'kg';
  const weightInKg = fromUnit === 'kg' ? numericValue : convertWeight(numericValue, 'lb', 'kg');
  return { weight: weightInKg, unit: fromUnit };
}

/**
 * Analyze sample values to determine predominant unit in a weight column
 * Used for UI display only - actual conversion uses normalizeWeight() per value
 */
export function analyzeWeightColumnUnits(
  columnName: string,
  sampleValues: string[],
  userPreferredUnit: 'metric' | 'imperial' = 'metric'
): 'kg' | 'lb' | 'mixed' {
  // Check column name first
  const columnUnit = detectWeightUnit(columnName);

  // Analyze sample values for explicit unit markers
  const detectedUnits = new Set<'kg' | 'lb'>();

  for (const value of sampleValues) {
    if (!value || value.trim() === '') continue;

    const valueUnitMatch = value.match(/(kg|lb|lbs|pound|kilo)/i);
    if (valueUnitMatch) {
      const unit = valueUnitMatch[1].toLowerCase();
      if (unit === 'kg' || unit === 'kilo') {
        detectedUnits.add('kg');
      } else {
        detectedUnits.add('lb');
      }
    }
  }

  // If values have mixed units, return 'mixed'
  if (detectedUnits.size > 1) {
    return 'mixed';
  }

  // If values have consistent unit, return it
  if (detectedUnits.size === 1) {
    return Array.from(detectedUnits)[0];
  }

  // If column name has unit, use it
  if (columnUnit) {
    return columnUnit;
  }

  // Fall back to user preference
  return userPreferredUnit === 'imperial' ? 'lb' : 'kg';
}
