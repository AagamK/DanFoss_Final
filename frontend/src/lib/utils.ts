import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- ADD THIS NEW EXPORT FUNCTION ---

/**
 * Converts an array of objects into a CSV string and triggers a download.
 * @param data The data array (e.g., idealSimulationData or actualSimulationData).
 * @param filename The desired filename for the downloaded file (e.g., "ideal_data.csv").
 */
export function downloadDataAsCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data provided to download.");
    return;
  }

  const keys = Object.keys(data[0]);
  const headers = keys.join(',');

  const rows = data.map(obj => {
    return keys.map(key => {
      let value = obj[key];
      if (typeof value === 'string' && value.includes(',')) {
        // Handle values containing commas by enclosing them in double quotes
        return `"${value}"`;
      }
      if (typeof value === 'number') {
        // Format numbers to a fixed precision if desired
        return value.toFixed(4);
      }
      return value;
    }).join(',');
  });

  // Combine headers and all rows
  const csvString = [headers, ...rows].join('\n');

  // Create a blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}