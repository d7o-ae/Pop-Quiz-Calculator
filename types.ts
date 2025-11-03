
// This type represents a single row of processed data.
// It contains the original data from the Excel row and the newly calculated average.
export interface ProcessedRow {
  originalRow: any[];
  calculatedAvg: number;
}
