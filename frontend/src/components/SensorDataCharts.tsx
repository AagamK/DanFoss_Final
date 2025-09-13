import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Wind, Gauge, TrendingUp } from "lucide-react";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";

interface SensorDataChartsProps {
  data: SimulationDataPoint[];
}

// Custom Tooltip for better readability on hover
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">Time: {Number(label).toFixed(2)}s</p>
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

// Helper function to get units for Y-axis labels
const getUnit = (dataKey: string) => {
    switch (dataKey) {
        case 'pressure_cap': return 'bar';
        case 'flow': return 'L/min';
        case 'velocity': return 'm/s';
        case 'vibration': return 'mm/s²';
        default: return '';
    }
};

export const SensorDataCharts = ({ data }: SensorDataChartsProps) => {
  // Add a placeholder for vibration if it doesn't exist in the uploaded data
  const chartData = data.map(d => ({...d, vibration: d.vibration || Math.random() * 0.2}));

  const charts = [
    { title: "Pressure", dataKey: "pressure_cap", color: "#8884d8", icon: Activity },
    { title: "Flow Rate", dataKey: "flow", color: "#82ca9d", icon: Gauge },
    { title: "Speed (Velocity)", dataKey: "velocity", color: "#ffc658", icon: Wind },
    { title: "Vibration", dataKey: "vibration", color: "#ff7300", icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart) => {
        const Icon = chart.icon;
        return (
          <Card key={chart.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color: chart.color }}/> {chart.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" unit="s" tickFormatter={(val) => val.toFixed(1)} />
                  <YAxis label={{ value: getUnit(chart.dataKey), angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey={chart.dataKey} name={chart.title} stroke={chart.color} dot={false} strokeWidth={2}/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};