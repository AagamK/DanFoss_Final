import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedRealTimeCharts } from "@/components/EnhancedRealTimeCharts";
import { AIAdvisor } from "@/components/AIAdvisor";
import { EnhancedSensorData } from "@/types/hydraulicData";
import { generateSampleData } from "@/utils/dataTransform";

const EnhancedRealTimeMonitoring = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<EnhancedSensorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setIsLoading(true);
    setTimeout(() => {
      const sampleData = generateSampleData();
      setData(sampleData);
      setIsLoading(false);
    }, 1000);
  }, []);

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
                {isConnected ? 'Connected to Database' : 'Disconnected'}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Enhanced Hydraulic Analysis Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive hydraulic system analysis with 6 key power metrics
          </p>
        </div>

        {/* Current Status Cards */}
        {currentData && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
                <CardTitle className="text-sm font-medium">Flow Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.flowRate.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">L/min</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pump Input Power</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.pumpInputPower.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">kW</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Motor Input Power</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.actualMotorInputPower.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">kW</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actuator Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.actuatorOutputPower.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">kW</p>
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
            <TabsTrigger value="charts">Enhanced Charts</TabsTrigger>
            <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6">
            <EnhancedRealTimeCharts 
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

export default EnhancedRealTimeMonitoring;
