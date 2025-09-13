import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RealTimeCharts } from "@/components/RealTimeCharts";
import { AIAdvisor } from "@/components/AIAdvisor";
import { useRealTimeData } from "@/hooks/useRealTimeData";

export interface SensorData {
  timestamp: string;
  stroke: number;
  pressure: number;
  temperature: number;
  vibration: number;
  status: 'normal' | 'warning' | 'critical';
}

const RealTimeMonitoring = () => {
  const navigate = useNavigate();
  const { data, isConnected, isLoading, error } = useRealTimeData();
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");

  const currentData = data[data.length - 1];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected to PostgreSQL' : 'Disconnected'}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Real-time Hydraulic Press Monitoring
          </h1>
          <p className="text-muted-foreground">
            Live data from PostgreSQL database with AI-powered analysis
          </p>
        </div>

        {/* Connection Error */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Database Connection Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Status Cards */}
        {currentData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stroke Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.stroke.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">mm</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pressure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.pressure.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">bar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.temperature.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">°C</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  System Status
                  {getStatusIcon(currentData.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${getStatusColor(currentData.status)} text-white`}>
                  {currentData.status.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts">Data Charts</TabsTrigger>
            <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6">
            <RealTimeCharts 
              data={data} 
              isLoading={isLoading}
              timeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
            />
          </TabsContent>

          <TabsContent value="advisor" className="mt-6">
            <AIAdvisor 
              currentData={currentData}
              historicalData={data}
              isConnected={isConnected}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;