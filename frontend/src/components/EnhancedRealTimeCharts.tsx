import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { EnhancedSensorData } from "@/types/hydraulicData";

interface EnhancedRealTimeChartsProps {
  data: EnhancedSensorData[];
  isLoading: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const EnhancedRealTimeCharts = ({ 
  data, 
  isLoading, 
  timeRange, 
  onTimeRangeChange 
}: EnhancedRealTimeChartsProps) => {
  
  const handleExportData = () => {
    if (!data.length) return;
    const csvContent = [
      [
        "Timestamp", "Time (s)", "Pressure (bar)", "Flow Rate (L/min)", "Pump Input Power (kW)",
        "Actual Motor Input Power (kW)", "Actuator Output Power (kW)", "Ideal Motor Input Power (kW)",
        "Stroke (mm)", "Temperature (°C)", "Vibration", "Status"
      ],
      ...data.map(row => [
        row.timestamp, row.time.toFixed(2), row.pressure.toFixed(2), row.flowRate.toFixed(2),
        row.pumpInputPower.toFixed(2), row.actualMotorInputPower.toFixed(2), row.actuatorOutputPower.toFixed(2),
        row.idealMotorInputPower.toFixed(2), row.stroke.toFixed(1), row.temperature.toFixed(1),
        row.vibration.toFixed(3), row.status
      ])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hydraulic_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timeRangeButtons = [
    { value: "1h", label: "1 Hour" },
    { value: "6h", label: "6 Hours" },
    { value: "24h", label: "24 Hours" }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
          Export CSV
        </Button>
      </div>

      {/* Change: Updated grid to be single-column */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pressure vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(value) => `${value.toFixed(0)}s`} />
                <YAxis label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value.toFixed(1)}s`}
                  formatter={(value: number) => [`${value.toFixed(2)} bar`, 'Pressure']}
                />
                <Line type="monotone" dataKey="pressure" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flow Rate vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(value) => `${value.toFixed(0)}s`} />
                <YAxis label={{ value: 'Flow Rate (L/min)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value.toFixed(1)}s`}
                  formatter={(value: number) => [`${value.toFixed(2)} L/min`, 'Flow Rate']}
                />
                <Line type="monotone" dataKey="flowRate" stroke="#82ca9d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pump Input Power vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(value) => `${value.toFixed(0)}s`} />
                <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value.toFixed(1)}s`}
                  formatter={(value: number) => [`${value.toFixed(2)} kW`, 'Pump Input Power']}
                />
                <Line type="monotone" dataKey="pumpInputPower" stroke="#ffc658" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actual Motor Input Power vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(value) => `${value.toFixed(0)}s`} />
                <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value.toFixed(1)}s`}
                  formatter={(value: number) => [`${value.toFixed(2)} kW`, 'Motor Input Power']}
                />
                <Line type="monotone" dataKey="actualMotorInputPower" stroke="#ff7300" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
       
        <Card>
          <CardHeader>
            <CardTitle>Actuator Output Power vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(value) => `${value.toFixed(0)}s`} />
                <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value.toFixed(1)}s`}
                  formatter={(value: number) => [`${value.toFixed(2)} kW`, 'Actuator Output Power']}
                />
                <Line type="monotone" dataKey="actuatorOutputPower" stroke="#00ff00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ideal Motor Input Power (100% Efficiency) vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={(value) => `${value.toFixed(0)}s`} />
                <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value.toFixed(1)}s`}
                  formatter={(value: number) => [`${value.toFixed(2)} kW`, 'Ideal Motor Power']}
                />
                <Line type="monotone" dataKey="idealMotorInputPower" stroke="#ff00ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};