import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import type { SensorData } from "@/pages/RealTimeMonitoring";

interface RealTimeChartsProps {
  data: SensorData[];
  isLoading: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const RealTimeCharts = ({ 
  data, 
  isLoading, 
  timeRange, 
  onTimeRangeChange 
}: RealTimeChartsProps) => {
  
  const handleExportData = () => {
    if (!data.length) return;
    const csvContent = [
      ["Timestamp", "Stroke (mm)", "Pressure (bar)", "Temperature (°C)", "Vibration", "Status"],
      ...data.map(row => [
        row.timestamp,
        row.stroke.toFixed(1),
        row.pressure.toFixed(1),
        row.temperature.toFixed(1),
        row.vibration.toFixed(3),
        row.status
      ])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hydraulic_monitoring_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timeRangeButtons = [
    { value: "1h", label: "1 Hour" }
  ];
  const formatXAxisLabel = (value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString();
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {timeRangeButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={timeRange === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeRangeChange(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
        <Button variant="secondary" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Change: Updated grid to be single-column */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stroke Position vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxisLabel}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis label={{ value: 'Stroke (mm)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${new Date(value).toLocaleString()}`}
                  formatter={(value: number) => [`${value.toFixed(1)} mm`, 'Stroke']}
                />
                <Line 
                  type="monotone" 
                  dataKey="stroke" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pressure vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxisLabel}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${new Date(value).toLocaleString()}`}
                  formatter={(value: number) => [`${value.toFixed(1)} bar`, 'Pressure']}
                />
                <Line 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temperature vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxisLabel}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${new Date(value).toLocaleString()}`}
                  formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vibration vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxisLabel}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis label={{ value: 'Vibration', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${new Date(value).toLocaleString()}`}
                  formatter={(value: number) => [`${value.toFixed(3)}`, 'Vibration']}
                />
                <Line 
                  type="monotone" 
                  dataKey="vibration" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};