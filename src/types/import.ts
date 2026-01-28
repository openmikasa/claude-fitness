export interface CsvRow {
  [key: string]: string;
}

export interface CsvMapping {
  dateColumn: string;
  workoutTypeColumn?: string;
  exerciseColumn?: string;
  weightColumn?: string;
  repsColumn?: string;
  setsColumn?: string;
  timeColumn?: string;
  distanceColumn?: string;
  notesColumn?: string;
}

export interface ImportPreview {
  headers: string[];
  sampleRows: CsvRow[];
  totalRows: number;
}

export interface CsvValidationError {
  row: number;
  field: string;
  message: string;
}
