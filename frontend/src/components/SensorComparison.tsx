import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { useMemo } from "react";
import { Activity, TrendingUp, Wind } from "lucide-react";

interface SensorComparisonProps {
  sensorOneData: SimulationDataPoint[];
  sensorTwoData: SimulationDataPoint[];
  isLoading: boolean;
}

export const SensorComparison = ({ sensorOneData, sensorTwoData, isLoading }: SensorComparisonProps) => {
  const combinedData = useMemo(() => {
    if (!sensorOneData.length || !sensorTwoData.length) return [];
    
    // Simple merge assuming datasets have similar time steps and length
    const maxLength = Math.max(sensorOneData.length, sensorTwoData.length);
    const data = [];
    for (let i = 0; i < maxLength; i++) {
      const d1 = sensorOneData[i];
      const d2 = sensorTwoData[i];
      data.push({
        time: d1?.time ?? d2?.time,
        s1_stroke: d1?.stroke,
        s2_stroke: d2?.stroke,
        s1_velocity: d1?.velocity,
        s2_velocity: d2?.velocity,
        s1_pressure_cap: d1?.pressure_cap,
        s2_pressure_cap: d2?.pressure_cap,
      });
    }
    return data;
  }, [sensorOneData, sensorTwoData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-80 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!combinedData.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Upload two sensor data files and click 'Compare Sensor Data' to view the comparison.
        </CardContent>
      </Card>
    );
  }

  const charts = [
    { title: "Displacement Comparison", icon: <TrendingUp/>, key1: "s1_stroke", key2: "s2_stroke", unit: "mm" },
    { title: "Velocity Comparison", icon: <Wind />, key1: "s1_velocity", key2: "s2_velocity", unit: "m/s" },
    { title: "Pressure (Cap End) Comparison", icon: <Activity />, key1: "s1_pressure_cap", key2: "s2_pressure_cap", unit: "bar" }
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {charts.map((chart, index) => (
        <Card key={index}>
          <CardHeader><CardTitle className="flex items-center gap-2">{chart.icon} {chart.title}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(val) => val.toFixed(1)} unit="s" />
                <YAxis label={{ value: `${chart.title.split(' ')[0]} (${chart.unit})`, angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(2)} ${chart.unit}`, name]} />
                <Legend />
                <Line type="monotone" dataKey={chart.key1} name="Sensor 1" stroke="#8884d8" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey={chart.key2} name="Sensor 2" stroke="#82ca9d" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};