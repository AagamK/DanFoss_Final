import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Define the shape of a single data point in our simulation results
interface SimDataPoint {
  time: number;
  idealPosition: number;
  actualPosition: number;
}

// Define the props for our component
interface CompareViewProps {
  simulationData: SimDataPoint[];
}

/**
 * Calculates the error data and formats it for the chart.
 * Error = Ideal Position - Actual Position
 */
const getComparisonData = (data: SimDataPoint[]) => {
  return data.map(point => ({
    ...point,
    // Calculate the error for this time step
    error: point.idealPosition - point.actualPosition,
  }));
};

export const CompareView: React.FC<CompareViewProps> = ({ simulationData }) => {
  const chartData = getComparisonData(simulationData);

  return (
    <div className="w-full h-[500px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
            type="number" 
          />
          
          {/* Left Y-Axis for Position */}
          <YAxis 
            yAxisId="left" 
            label={{ value: 'Position (mm)', angle: -90, position: 'insideLeft' }} 
          />
          
          {/* Right Y-Axis for Error */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Error (mm)', angle: 90, position: 'insideRight' }} 
          />
          
          <Tooltip formatter={(value: number) => value.toFixed(4)} />
          <Legend />
          
          {/* Line 1: The "Calculated Graph" (Ideal) */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="idealPosition"
            stroke="#8884d8"
            name="Ideal Position"
            dot={false}
          />
          
          {/* Line 2: The "Error Graph" */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="error"
            stroke="#e53e3e"
            name="Position Error (Ideal - Actual)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};