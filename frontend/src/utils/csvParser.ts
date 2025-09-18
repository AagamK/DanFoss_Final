import Papa from 'papaparse';
import type { SimulationDataPoint } from '@/hooks/useHydraulicCalculations';

// --- HEADER NORMALIZATION MAP ---
// Maps CSV headers (all lowercase) to our internal application key names.
// This is the key fix for the AI Diagnostic tab.
const headerNormalizationMap: { [key: string]: string } = {
    'time': 'time',
    'disoplacement': 'stroke', // CSV typo "Disoplacement" -> internal "stroke"
    'speed': 'velocity',
    'piston side pressure': 'pressure_cap',
    'rod side pressure': 'pressure_rod',
    'piston side flow': 'flow',
    'rod side flow': 'flow_rod', // Added for completeness
};

// --- GENERIC CSV PARSER (NOW WITH NORMALIZATION) ---
export const parseGenericCSV = (file: File): Promise<{ data: any[], headers: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          return reject(new Error(`CSV Parsing Error: ${results.errors[0].message}`));
        }

        const originalHeaders = results.meta.fields || [];
        if (originalHeaders.length === 0) {
          return reject(new Error("CSV appears to be empty or has no valid header row."));
        }

        const normalizedHeaders: string[] = [];
        const finalData = (results.data as any[]).map(row => {
            const normalizedRow: { [key: string]: any } = {};
            
            for (const csvHeader of originalHeaders) {
                if (!csvHeader || csvHeader.trim() === "") {
                    continue; // Skip empty columns from your CSV
                }

                // Get the internal app key (e.g., "stroke") from the CSV key (e.g., "Disoplacement")
                const normalizedKey = headerNormalizationMap[csvHeader.toLowerCase().trim()];

                if (normalizedKey) {
                    // This is a known column. Rename it.
                    normalizedRow[normalizedKey] = row[csvHeader];
                } else {
                    // This is an unknown column. Keep its original name.
                    normalizedRow[csvHeader] = row[csvHeader];
                }
            }
            return normalizedRow;
        });

        // Get the final list of headers AFTER normalization
        if (finalData.length > 0) {
            normalizedHeaders.push(...Object.keys(finalData[0]));
        }

        resolve({ data: finalData, headers: normalizedHeaders });
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
};


// --- EXISTING SIMULATION-SPECIFIC PARSER (UNCHANGED) ---
// This code is left here as other parts of your app may depend on it.

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
        const index = headers.findIndex(header => header.toLowerCase().trim().includes(name.toLowerCase()));
        if (index !== -1) return index;
    }
    return -1;
};

export const parseGraphDataFromCSV = (file: File): Promise<SimulationDataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];
          if (data.length < 2) return reject(new Error("CSV must contain a header and at least one data row."));

          const headers = data[0].map(h => h.trim().toLowerCase());
          const dataStartIndex = !isNaN(parseFloat(data[1][0])) ? 1 : 2;

          if (data.length <= dataStartIndex) return reject(new Error("No data rows found in CSV."));
          
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

          if (missingColumns.length > 0) return reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          
          const dataRows = data.slice(dataStartIndex);
          const parsedData: SimulationDataPoint[] = dataRows.map((row) => {
            const getNumericValue = (index: number) => index !== -1 ? parseFloat(row[index]) : 0;

            const time = getNumericValue(columnIndexMap.time);
            const stroke = getNumericValue(columnIndexMap.stroke);
            const velocity = getNumericValue(columnIndexMap.velocity);
            const pressure_cap = getNumericValue(columnIndexMap.pressure_cap);
            const pressure_rod = getNumericValue(columnIndexMap.pressure_rod);
            const flow = getNumericValue(columnIndexMap.flow);

            if ([time, stroke, velocity, pressure_cap].some(isNaN)) return null;

            return {
              time, stroke, velocity, pressure_cap, pressure_rod, flow,
              motorPower: (pressure_cap * flow) / 600,
              actuatorOutputPower: 0, 
              temperature: 45 + (Math.random() * 10),
              vibration: Math.random() * 0.2,
            };
          }).filter((point): point is SimulationDataPoint => point !== null);
          
          if (parsedData.length === 0) return reject(new Error("No valid numerical data could be parsed."));

          resolve(parsedData);
        } catch (error) {
          reject(new Error("An error occurred while processing the CSV file."));
        }
      },
      error: (error: Error) => reject(error),
    });
  });
};