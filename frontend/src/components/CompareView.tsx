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
import { ComparisonDataPoint } from './HydraulicSimulator'; 

interface DualAxisCompareChartProps {
  data: ComparisonDataPoint[];
  metricName: string;
  unit: string;
  errorUnit: string;
  idealKey: keyof ComparisonDataPoint;
  actualKey: keyof ComparisonDataPoint;
  errorKey: keyof ComparisonDataPoint;
}

const DualAxisCompareChart: React.FC<DualAxisCompareChartProps> = ({ 
  data, metricName, unit, errorUnit, idealKey, actualKey, errorKey 
}) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-card">
      <h3 className="text-lg font-semibold mb-4 text-center">{metricName} Analysis</h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {/* Animations MUST be disabled for this to work reliably */}
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
            isAnimationActive={false}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }} 
              type="number" 
              stroke="#888888"
            />
            <YAxis 
              yAxisId="left"
              label={{ value: `${metricName} (${unit})`, angle: -90, position: 'insideLeft', offset: -10 }} 
              stroke="#8884d8"
            />
             <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: `Error (${errorUnit})`, angle: 90, position: 'insideRight', offset: 0 }} 
              stroke="#ca8282"
            />
            <Tooltip 
              formatter={(value: number, name: string) => [value.toFixed(2), name]}
              labelFormatter={(label: number) => `Time: ${label.toFixed(2)}s`}
            />
            <Legend verticalAlign="top" height={36} />
            <Line yAxisId="left" type="monotone" dataKey={idealKey as string} name="Ideal" stroke="#8884d8" dot={false} strokeWidth={2} isAnimationActive={false} />
            <Line yAxisId="left" type="monotone" dataKey={actualKey as string} name="Actual" stroke="#82ca9d" dot={false} strokeWidth={2} isAnimationActive={false} />
            <Line yAxisId="right" type="monotone" dataKey={errorKey as string} name="Error (Ideal - Actual)" stroke="#e53e3e" dot={false} strokeDasharray="3 3" strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface CompareViewProps {
  comparisonData: ComparisonDataPoint[];
}

export const CompareView: React.FC<CompareViewProps> = ({ comparisonData }) => {
  if (!comparisonData || comparisonData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-lg bg-card text-muted-foreground">
        Run a simulation to see the comparison data.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DualAxisCompareChart data={comparisonData} metricName="Displacement" unit="mm" errorUnit="mm" idealKey="idealPosition" actualKey="actualPosition" errorKey="positionError" />
      <DualAxisCompareChart data={comparisonData} metricName="Velocity" unit="mm/s" errorUnit="mm/s" idealKey="idealVelocity" actualKey="actualVelocity" errorKey="velocityError" />
      <DualAxisCompareChart data={comparisonData} metricName="Cap End Pressure" unit="bar" errorUnit="bar" idealKey="idealPressure" actualKey="actualPressure" errorKey="pressureError" />
      <DualAxisCompareChart data={comparisonData} metricName="Pump Flow Rate" unit="L/min" errorUnit="L/min" idealKey="idealFlow" actualKey="actualFlow" errorKey="flowError" />
      <DualAxisCompareChart data={comparisonData} metricName="Power Analysis (Actuator)" unit="kW" errorUnit="kW" idealKey="idealPower" actualKey="actualPower" errorKey="powerError" />
    </div>
  );
};