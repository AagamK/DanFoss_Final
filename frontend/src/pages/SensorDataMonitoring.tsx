import { useState, ChangeEvent, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Brain, BarChart3, AlertTriangle, CheckCircle, Activity, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AIAdvisor } from "@/components/AIAdvisor";
import { SensorDataCharts } from "@/components/SensorDataCharts";
import type { PredictionResponse } from "@/types/predictions";
import { parseGenericCSV } from '@/utils/csvParser'; // We only need the generic parser

// Define a generic type for any row from any CSV
type GenericDataPoint = { [key: string]: string | number };

const SensorDataMonitoring = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<GenericDataPoint[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState("graphs");
    const [isSimulationCompatible, setIsSimulationCompatible] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
            handleFileUpload(selectedFile);
        }
    };
    
    const handleFileUpload = async (selectedFile: File) => {
        setIsLoading(true);
        setData([]);
        setHeaders([]);
        setPrediction(null);
        setIsSimulationCompatible(false);

        try {
            // Step 1: Parse the CSV. This will now return normalized data.
            const { data: parsedData, headers: parsedHeaders } = await parseGenericCSV(selectedFile);
            setData(parsedData);
            setHeaders(parsedHeaders);
            
            // Step 2: Check if the *normalized* headers contain what the AI needs.
            const requiredSimHeaders = ['stroke', 'velocity', 'pressure_cap'];
            const lowerCaseHeaders = parsedHeaders.map(h => h.toLowerCase().trim());
            
            const hasAllSimHeaders = requiredSimHeaders.every(h => lowerCaseHeaders.includes(h));
            
            // This will now be TRUE
            setIsSimulationCompatible(hasAllSimHeaders);
            setActiveTab("graphs");
            
            toast.success("File Uploaded Successfully", {
                description: `Analyzed ${parsedData.length} data points from ${selectedFile.name}. AI Diagnostics are ${hasAllSimHeaders ? 'available' : 'disabled'}.`
            });
            
        } catch (err) {
            toast.error("File Processing Error", {
                description: err instanceof Error ? err.message : "Could not read or parse the selected file.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Memoize plottable keys to avoid re-calculation
    const plottableKeys = useMemo(() => {
        if (data.length === 0) return [];
        const firstRow = data[0];
        const timeKey = headers.find(h => h.toLowerCase() === 'time');
        return headers.filter(key => 
            key !== timeKey && 
            typeof firstRow[key] === 'number' && 
            isFinite(firstRow[key])
        );
    }, [data, headers]);

    const latestDataPoint = data.length > 0 ? data[data.length - 1] : null;

    const getStatusInfo = () => {
        if (!isSimulationCompatible) return { text: "AI Disabled", icon: <Info className="h-5 w-5 text-amber-500"/>, color: "text-amber-500" };
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

    // Helper to safely get and format numbers for the summary cards
    const getCardValue = (key: string | undefined) => {
        if (!key || !latestDataPoint || typeof latestDataPoint[key] !== 'number') {
            return 'N/A';
        }
        return (latestDataPoint[key] as number).toFixed(1);
    }
    
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
                        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium truncate">Stroke</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{getCardValue('stroke')}</div></CardContent></Card>
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium truncate">Velocity</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{getCardValue('velocity')}</div></CardContent></Card>
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium truncate">Cap Pressure</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{getCardValue('pressure_cap')}</div></CardContent></Card>
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">System Status {statusInfo.icon}</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.text}</p></CardContent></Card>
                        </div> */}

                        <Tabs defaultValue="graphs" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="graphs"><BarChart3 className="h-4 w-4 mr-2" />Graphs</TabsTrigger>
                                <TabsTrigger value="diagnostics" disabled={!isSimulationCompatible}>
                                    <Brain className="h-4 w-4 mr-2" />AI Diagnostics
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="graphs" className="mt-6">
                                <SensorDataCharts data={data} />
                            </TabsContent>
                            <TabsContent value="diagnostics" className="mt-6">
                                {isSimulationCompatible ? (
                                    // This now works because data has { stroke, velocity, ... } keys
                                    <AIAdvisor simulationData={data} onPrediction={setPrediction} />
                                ) : (
                                    <div className="text-center py-10 rounded-lg bg-card border">
                                        <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">AI Diagnostics Not Available</h3>
                                        <p className="text-muted-foreground px-4">The uploaded CSV is missing the specific columns required for this analysis.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </div>
    );
};

export default SensorDataMonitoring;