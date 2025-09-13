import Papa from 'papaparse';
import type { SimulationDataPoint } from '@/hooks/useHydraulicCalculations';

// Helper function to find a column index by checking multiple possible names
const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
        // Find index by checking if the header (in lowercase, trimmed) includes the possible name
        const index = headers.findIndex(header => header.toLowerCase().trim().includes(name.toLowerCase()));
        if (index !== -1) {
            return index;
        }
    }
    return -1; // Return -1 if no matching header is found
};

export const parseGraphDataFromCSV = (file: File): Promise<SimulationDataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];
          if (data.length < 2) {
            reject(new Error("CSV must contain at least a header and one data row."));
            return;
          }

          const rawHeaders = data[0];
          const headers = rawHeaders.map(h => h.trim().toLowerCase());

          // --- Determine where the actual data starts ---
          // Check if the second row looks like a header/unit row or a data row
          const isSecondRowData = !isNaN(parseFloat(data[1][0]));
          const dataStartIndex = isSecondRowData ? 1 : 2;

          if (data.length <= dataStartIndex) {
            reject(new Error("No data rows found in the CSV file after the header."));
            return;
          }

          const columnIndexMap = {
            time: findColumnIndex(headers, ['time']),
            stroke: findColumnIndex(headers, ['stroke', 'displacement']),
            velocity: findColumnIndex(headers, ['velocity']),
            pressure_rod: findColumnIndex(headers, ['rod end', 'rod end pressure']),
            pressure_cap: findColumnIndex(headers, ['cap end', 'cap end pressure']),
            flow: findColumnIndex(headers, ['flow']),
          };

          const requiredColumns = ['time', 'stroke', 'velocity', 'pressure_cap'];
          const missingColumns = requiredColumns.filter(key => columnIndexMap[key as keyof typeof columnIndexMap] === -1);

          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns in CSV header: ${missingColumns.join(', ')}`));
            return;
          }
          
          const dataRows = data.slice(dataStartIndex);

          const parsedData: SimulationDataPoint[] = dataRows.map((row) => {
            const getNumericValue = (index: number) => index !== -1 ? parseFloat(row[index]) : 0;

            const time = getNumericValue(columnIndexMap.time);
            const stroke = getNumericValue(columnIndexMap.stroke);
            const velocity = getNumericValue(columnIndexMap.velocity);
            const pressure_cap = getNumericValue(columnIndexMap.pressure_cap);
            const pressure_rod = getNumericValue(columnIndexMap.pressure_rod);
            const flow = getNumericValue(columnIndexMap.flow);

            if ([time, stroke, velocity, pressure_cap].some(isNaN)) {
                return null;
            }

            return {
              time,
              stroke,
              velocity,
              pressure_cap,
              pressure_rod,
              flow,
              motorPower: (pressure_cap * flow) / 600, // Approximation
              actuatorOutputPower: 0, 
              temperature: 45 + (Math.random() * 10),
              vibration: Math.random() * 0.2,
            };
          }).filter((point): point is SimulationDataPoint => point !== null);
          
          if (parsedData.length === 0) {
            reject(new Error("No valid numerical data could be parsed from the file."));
            return;
          }

          resolve(parsedData);
        } catch (error) {
          reject(new Error("An error occurred while processing the CSV file."));
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};