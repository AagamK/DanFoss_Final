import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { HydraulicParameters } from './ParameterForm'; 

// --- MODIFIED --- Props now accepts an array of strings
interface ReportProps {
  results: any; 
  parameters: HydraulicParameters;
  graphImages: string[] | null; // This is now an array
}

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHvxk.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh6Uew.ttf', fontWeight: 700 },
  ],
});
Font.register({ family: 'Helvetica-Bold', src: 'https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh6Uew.ttf' });
Font.register({ family: 'Helvetica-Oblique', src: 'https://fonts.gstatic.com/s/lato/v16/S6u-w4BMUTPHjxs.ttf', fontStyle: 'italic' });


// Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  title: { fontSize: 20, textAlign: 'center', marginBottom: 10, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 11, textAlign: 'center', marginBottom: 25, color: '#555' },
  sectionTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#aaaaaa' },
  table: { width: '100%', border: '1px solid #eee', borderRadius: 3, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #eee' },
  tableColLabel: { width: '40%', padding: 8, backgroundColor: '#f9f9f9', fontFamily: 'Helvetica-Bold' },
  tableColValue: { width: '60%', padding: 8 },
  nestedTable: { marginLeft: 20, width: '90%', border: '1px solid #f0f0f0', borderRadius: 3, marginTop: 5 },
  nestedRow: { flexDirection: 'row', borderBottom: '1px solid #f9f9f9' },
  nestedColLabel: { width: '40%', padding: 6, backgroundColor: '#fafafa', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  nestedColValue: { width: '60%', padding: 6, fontSize: 9 },
  subsectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 5, marginBottom: 5, padding: 8, backgroundColor: '#f9f9f9' },
  formulaSection: { marginTop: 10, marginBottom: 15 },
  formulaTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  formulaText: { fontSize: 10, fontFamily: 'Helvetica-Oblique', marginBottom: 3, marginLeft: 10 },
  formulaCalc: { fontSize: 10, fontFamily: 'Helvetica', marginBottom: 3, marginLeft: 10 },
  resultText: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 5, marginLeft: 10 },
  graphImage: { 
    width: '100%', 
    height: 'auto', 
    marginTop: 10, 
    marginBottom: 10,
  },
  pageBreak: { // A helper to create page breaks
    break: true,
  }
});


/**
 * Helper component to render ANY data, including nested objects like 'phases'.
 * This fixes both your 'Key Metrics' bug and your 'add Phases' request.
 */
const KeyValueRenderer: React.FC<{ data: any }> = ({ data }) => {
  if (!data) {
    return null; 
  }
  const formatKey = (key: string) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <View style={styles.table}>
      {Object.entries(data).map(([key, value]) => {
        
        // This renders the 'phases' object as a subsection
        if (typeof value === 'object' && value !== null) {
          return (
            <View key={key}>
              <Text style={styles.subsectionTitle}>{formatKey(key)}:</Text>
              <View style={styles.nestedTable}>
                {Object.entries(value).map(([subKey, subValue]) => (
                  <View style={styles.nestedRow} key={subKey}>
                    <Text style={styles.nestedColLabel}>{formatKey(subKey)}:</Text>
                    {/* Render the phase parameters */}
                    {typeof subValue === 'object' && subValue !== null ? (
                       <Text style={styles.nestedColValue}>{`Speed: ${subValue.speed}, Stroke: ${subValue.stroke}, Time: ${subValue.time}`}</Text>
                    ) : (
                       <Text style={styles.nestedColValue}>{String(subValue)}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        }
        
        // Render simple row
        return (
          <View style={styles.tableRow} key={key}>
            <Text style={styles.tableColLabel}>{formatKey(key)}:</Text>
            <Text style={styles.tableColValue}>{String(value)}</Text>
          </View>
        );
      })}
    </View>
  );
};


// Main PDF Document
export const SimulationReport: React.FC<ReportProps> = ({ results, parameters, graphImages }) => (
  <Document>
    
    {/* --- PAGE 1: Parameters and Metrics --- */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Hydraulic Simulation Report</Text>
      <Text style={styles.subtitle}>Generated on: {new Date().toLocaleString()}</Text>
      
      <Text style={styles.sectionTitle}>Input Parameters</Text>
      <KeyValueRenderer data={parameters} />
      
      {/* This section now ONLY appears if 'results' has data. This removes your error message. */}
      {results && Object.keys(results).length > 0 && (
        <>
          <Text style={{...styles.sectionTitle, marginTop: 20}}>Key Metrics</Text>
          <KeyValueRenderer data={results} />
        </>
      )}
    </Page>
    
    {/* --- PAGE 2: Hardcoded Formulas Page (unchanged) --- */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Formulas & Example Calculations</Text>
      <View style={styles.formulaSection}><Text style={styles.formulaTitle}>Cylinder Area</Text><Text style={styles.formulaText}>Area = ({"\u03C0"} * Diameter²) / 4</Text><Text style={styles.formulaCalc}>Bore Area = ({"\u03C0"} * 75² mm²) / 4 = 44.2 cm²</Text><Text style={styles.formulaCalc}>Rod Area = ({"\u03C0"} * 45² mm²) / 4 = 15.9 cm²</Text><Text style={styles.resultText}>Annular Area = 44.2 - 15.9 = 28.3 cm²</Text></View>
      <View style={styles.formulaSection}><Text style={styles.formulaTitle}>Pressure (Working Cycle Example)</Text><Text style={styles.formulaText}>Pressure (bar) = (Load (N) / (Area (m²) * 100000)) + System Losses (bar)</Text><Text style={styles.formulaCalc}>Load (N) = 8 Ton * 1000 * 9.81 = 78480 N</Text><Text style={styles.formulaCalc}>Pressure = (78480 N / (0.00442 m² * 100000)) + 10 bar</Text><Text style={styles.resultText}>Result = 187.6 bar</Text></View>
       <View style={styles.formulaSection}><Text style={styles.formulaTitle}>Flow Rate (Fast Down Example)</Text><Text style={styles.formulaText}>Flow (L/min) = Area (m²) * Speed (m/s) * 60000</Text><Text style={styles.formulaCalc}>Speed = 200 mm/s = 0.200 m/s</Text><Text style={styles.formulaCalc}>Flow = 0.00442 m² * 0.200 m/s * 60000</Text><Text style={styles.resultText}>Result = 53.01 L/min (based on max flow across all phases)</Text></View>
       <View style={styles.formulaSection}><Text style={styles.formulaTitle}>Motor Power (Working Cycle Example)</Text><Text style={styles.formulaText}>Pump Power (kW) = (Pressure (bar) * Flow (L/min)) / 600</Text><Text style={styles.formulaText}>Motor Power (kW) = Pump Power / Pump Efficiency</Text><Text style={styles.formulaCalc}>Flow (Working Cycle) = 2.65 L/min</Text><Text style={styles.formulaCalc}>Pump Power = (187.6 bar * 2.65 L/min) / 600</Text><Text style={styles.formulaCalc}>Motor Power = 0.83 kW / 0.9</Text><Text style={styles.resultText}>Result = 0.92 kW</Text></View>
    </Page>
    
    {/* --- MODIFIED PAGE 3: Graph Images --- */}
    {/* This will now render ALL 5 graphs, adding page breaks as needed. */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Comparison Analysis Graphs</Text>
      
      {graphImages && graphImages.length > 0 ? (
        <>
          <Text style={{fontSize: 9, fontFamily: 'Helvetica-Oblique', marginBottom: 10}}>Displaying 5 charts comparing Ideal vs. Actual performance.</Text>
          <Image style={styles.graphImage} src={graphImages[0]} />
          <Image style={styles.graphImage} src={graphImages[1]} />
          <Image style={styles.graphImage} src={graphImages[2]} />
          {/* Page break to fit all 5 charts */}
          <Text style={styles.pageBreak}></Text>
          <Image style={styles.graphImage} src={graphImages[3]} />
          <Image style={styles.graphImage} src={graphImages[4]} />
        </>
      ) : (
        <Text>Graph images could not be generated. This indicates the graph conversion failed.</Text>
      )}
    </Page>
  </Document>
);