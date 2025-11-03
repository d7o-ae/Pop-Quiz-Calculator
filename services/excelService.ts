
// Make TypeScript aware of the global XLSX object from the CDN script
declare const XLSX: any;

/**
 * Reads an Excel file and converts its first sheet to a 2D array.
 * @param file The Excel file to read.
 * @returns A promise that resolves to a 2D array of the sheet data.
 */
export function readFileAsArray(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
          return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates and triggers a download for an Excel file from a 2D array.
 * @param data The 2D array to convert to an Excel sheet.
 * @param fileName The name of the file to be downloaded.
 */
export function exportArrayToExcel(data: any[][], fileName: string): void {
  try {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, fileName);
  } catch (err) {
    console.error("Failed to export Excel file:", err);
    // You might want to show an error to the user here
  }
}
