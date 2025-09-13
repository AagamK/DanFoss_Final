import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { TrendingUp, Gauge, Zap, Activity, Wind } from "lucide-react";

interface SimulationGraphsProps {
  data: SimulationDataPoint[];
  isLoading: boolean;
}

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
const getUnit = (dataKey: string) => {
  switch (dataKey) {
    case 'flow': return 'L/min';
    case 'pressure_cap': return 'bar';
    case 'pressure_rod': return 'bar';
    case 'stroke': return 'mm';
    case 'velocity': return 'm/s';
    case 'idealMotorInputPower': return 'kW';
    case 'actualMotorInputPower': return 'kW';
    case 'actuatorOutputPower': return 'kW';
    default: return '';
  }
};
export const SimulationGraphs = ({ data, isLoading }: SimulationGraphsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <Card className="shadow-technical">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No simulation or file data available</p>
            <p className="text-sm mt-2">Run a simulation or plot a file to generate graphs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTime = data.length > 0 ? Math.max(...data.map(d => d.time)) : 0;
  const xTicks = [];
  for (let i = 0; i <= maxTime + 0.75; i += 0.75) {
    xTicks.push(i);
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 1. Time VS Displacement */}
      <Card id="displacement-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp /> Time VS Displacement</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Wind /> Time VS Velocity</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="velocity" name="Velocity" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Time VS Pressure at cap end */}
      <Card id="pressure-cap-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity /> Time VS Pressure at Cap End</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="pressure_cap" name="Pressure (Cap End)" stroke="#f59e0b" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* 4. Time VS Pressure at rod end */}
      <Card id="pressure-rod-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity /> Time VS Pressure at Rod End</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="pressure_rod" name="Pressure (Rod End)" stroke="#ef4444" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* 5. Time VS Flow rate of pump */}
      <Card id="flow-rate-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Gauge /> Time VS Flow Rate of Pump</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} ticks={xTicks} tickFormatter={(val) => val.toFixed(2)} unit="s" />
              <YAxis label={{ value: 'Flow (L/min)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="linear" dataKey="flow" name="Flow Rate" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. Power Analysis Graph (NEW) */}
      <Card id="power-analysis-graph">
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap /> Power Analysis</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                type="number" 
                domain={[0, 'dataMax']} 
                ticks={xTicks}
                tickFormatter={(val) => val.toFixed(2)} 
                unit="s" 
              />
              <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(2)} kW`, name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())]} />
              <Legend />
              <Line type="monotone" dataKey="idealMotorInputPower" name="Ideal Motor Input" stroke="#a78bfa" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="actualMotorInputPower" name="Actual Motor Input" stroke="#ef4444" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="actuatorOutputPower" name="Actuator Output" stroke="#22c55e" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};