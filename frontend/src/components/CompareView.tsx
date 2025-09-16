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
import { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
// --- From Step 2 ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Gauge, Activity, Wind } from "lucide-react"; 

// --- From Step 2 ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">Time: {Number(label).toFixed(2)}s</p>
        <p className="text-xs text-muted-foreground mb-2">Phase: {data.phase}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(2)} {getUnit(entry.dataKey)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
// --- From Step 2 ---
const getUnit = (dataKey: string) => {
  switch (dataKey) {
    case 'flow': return 'L/min';
    case 'pressure_cap': return 'bar';
    case 'pressure_rod': return 'bar';
    case 'stroke': return 'mm';
    case 'velocity': return 'mm/s';
    case 'idealMotorInputPower': return 'kW';
    case 'actualMotorInputPower': return 'kW';
    case 'actuatorOutputPower': return 'kW';
    default: return '';
  }
};

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
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
            // isAnimationActive={false}
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
  simulationData: SimulationDataPoint[]; // <-- From Step 1
}

export const CompareView: React.FC<CompareViewProps> = ({ comparisonData, simulationData }) => { // <-- From Step 1
  if ((!comparisonData || comparisonData.length === 0) && (!simulationData || simulationData.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-lg bg-card text-muted-foreground">
        Run a simulation to see the comparison data.
      </div>
    );
  }

  // --- From Step 2 ---
  const maxTime = simulationData.length > 0 ? Math.max(...simulationData.map(d => d.time)) : 0;
  const xTicks = [];
  for (let i = 0; i <= maxTime + 0.75; i += 0.75) {
    xTicks.push(i);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Existing Dual Axis Charts */}
      {/* <DualAxisCompareChart data={comparisonData} metricName="Displacement" unit="mm" errorUnit="mm" idealKey="idealPosition" actualKey="actualPosition" errorKey="positionError" />
      <DualAxisCompareChart data={comparisonData} metricName="Velocity" unit="mm/s" errorUnit="mm/s" idealKey="idealVelocity" actualKey="actualVelocity" errorKey="velocityError" />
      <DualAxisCompareChart data={comparisonData} metricName="Cap End Pressure" unit="bar" errorUnit="bar" idealKey="idealPressure" actualKey="actualPressure" errorKey="pressureError" />
      <DualAxisCompareChart data={comparisonData} metricName="Pump Flow Rate" unit="L/min" errorUnit="L/min" idealKey="idealFlow" actualKey="actualFlow" errorKey="flowError" />
      <DualAxisCompareChart data={comparisonData} metricName="Power Analysis (Actuator)" unit="kW" errorUnit="kW" idealKey="idealPower" actualKey="actualPower" errorKey="powerError" /> */}

      {/* --- STEP 3: PASTED GRAPHS (FROM SIMULATIONGRAPHS.TSX) --- */}

      {/* 1. Time VS Displacement */}
      <Card id="displacement-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp /> Displacement VS Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {/* MODIFIED: Changed data={data} to data={simulationData} */}
            <LineChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Displacement (mm)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="stroke" name="Displacement" stroke="#3b82f6" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Time VS Velocity */}
      <Card id="velocity-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Wind />Velocity VS Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
             {/* MODIFIED: Changed data={data} to data={simulationData} */}
            <LineChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Velocity (mm/s)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="velocity" name="Velocity" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Time VS Pressure at cap end */}
      <Card id="pressure-cap-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity />Pressure VS Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
             {/* MODIFIED: Changed data={data} to data={simulationData} */}
            <LineChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="pressure_cap" name="Pressure (Cap End)" stroke="#f59e0b" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* 5. Time VS Flow rate of pump */}
      <Card id="flow-rate-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Gauge />Flow Rate of Pump VS Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
             {/* MODIFIED: Changed data={data} to data={simulationData} */}
            <LineChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Flow (L/min)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="flow" name="Flow Rate" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* END OF STEP 3 */}

    </div>
  );
};