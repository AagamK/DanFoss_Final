import { useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Brain, BarChart3, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AIAdvisor } from "@/components/AIAdvisor";
import { SensorDataCharts } from "@/components/SensorDataCharts";
import type { PredictionResponse } from "@/types/predictions";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { parseGraphDataFromCSV } from "@/utils/csvParser";

const SensorDataMonitoring = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("graphs");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      handleFileUpload(selectedFile);
    }
  };
  
  const handleFileUpload = async (selectedFile: File) => {
      setIsLoading(true);
      setData([]);
      setPrediction(null);
      try {
          const parsedData = await parseGraphDataFromCSV(selectedFile);
          setData(parsedData);
          setActiveTab("graphs");
          toast.success("File Uploaded & Plotted Successfully", {
              description: `Analyzed ${parsedData.length} data points from ${selectedFile.name}.`
          });
      } catch (err) {
          toast.error("File Processing Error", {
              description: err instanceof Error ? err.message : "Could not read the file.",
          });
      } finally {
          setIsLoading(false);
      }
  };

  const latestDataPoint = data.length > 0 ? data.reduce((latest, current) => latest.time > current.time ? latest : current) : null;
  if (latestDataPoint && !latestDataPoint.temperature) {
    latestDataPoint.temperature = 45 + Math.random() * 10;
  }

  const getStatusInfo = () => {
      if (!prediction) return { text: "Awaiting Analysis", icon: <Activity className="h-5 w-5 text-muted-foreground"/>, color: "text-muted-foreground" };
      switch (prediction.severity) {
          case "critical":
          case "high":
              return { text: "Action Required", icon: <AlertTriangle className="h-5 w-5 text-destructive"/>, color: "text-destructive" };
          default:
              return { text: "Normal", icon: <CheckCircle className="h-5 w-5 text-green-500"/>, color: "text-green-500" };
      }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sensor Data Monitoring</h1>
          <p className="text-muted-foreground">Upload hydraulic sensor data from a CSV file to plot graphs and receive AI-powered diagnostics.</p>
        </div>
        
        <Card className="mb-6">
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-grow w-full">
                    <label htmlFor="csv-upload" className="sr-only">Upload CSV</label>
                    <Input id="csv-upload" type="file" accept=".csv, .txt" onChange={handleFileChange} />
                </div>
                <p className="text-sm text-muted-foreground text-center md:text-left">
                    {file ? `File: ${file.name}` : "Please select a file to begin analysis."}
                </p>
            </CardContent>
        </Card>
        
        {isLoading && <p className="text-center text-muted-foreground py-10">Loading and processing data...</p>}

        {data.length > 0 && !isLoading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stroke Position</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{latestDataPoint?.stroke?.toFixed(1) || 'N/A'}</div><p className="text-xs text-muted-foreground">mm</p></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pressure</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{latestDataPoint?.pressure_cap?.toFixed(1) || 'N/A'}</div><p className="text-xs text-muted-foreground">bar</p></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Temperature</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{latestDataPoint?.temperature?.toFixed(1) || 'N/A'}</div><p className="text-xs text-muted-foreground">°C</p></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">System Status {statusInfo.icon}</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.text}</p></CardContent></Card>
            </div>
            <Tabs defaultValue="graphs" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="graphs"><BarChart3 className="h-4 w-4 mr-2" />Graphs</TabsTrigger>
                <TabsTrigger value="diagnostics"><Brain className="h-4 w-4 mr-2" />AI Diagnostics</TabsTrigger>
              </TabsList>
              <TabsContent value="graphs" className="mt-6">
                <SensorDataCharts data={data} />
              </TabsContent>
              <TabsContent value="diagnostics" className="mt-6">
                <AIAdvisor simulationData={data} onPrediction={setPrediction} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default SensorDataMonitoring;