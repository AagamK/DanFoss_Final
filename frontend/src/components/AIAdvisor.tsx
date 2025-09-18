import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, RefreshCw, Wrench, BarChart2, Info, CheckCircle } from "lucide-react";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { Skeleton } from "./ui/skeleton";
import type { PredictionResponse } from "@/types/predictions";

interface AIAdvisorProps {
  simulationData: SimulationDataPoint[];
  onPrediction: (prediction: PredictionResponse | null) => void;
}

const calculateFeaturesFromData = (data: SimulationDataPoint[]) => {
    if (!data || data.length === 0) return null;
    const getStats = (key: keyof SimulationDataPoint) => {
        const values = data.map(p => p[key] as number).filter(v => !isNaN(v));
        if (values.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);
        return { mean, std, min: Math.min(...values), max: Math.max(...values) };
    };
    const ps1 = getStats('pressure_cap'), ps2 = getStats('pressure_rod'), ps3 = getStats('motorPower');
    const ts1 = { mean: 45 + (Math.random()-0.5)*5, std: 5, min: 40, max: 50 };
    const ts2 = { mean: 48 + (Math.random()-0.5)*5, std: 4, min: 42, max: 52 };
    const vs1 = { mean: 0.2 + (Math.random()-0.5)*0.1, std: 0.1, min: 0.05, max: 0.4 };
    return {
        'PS1_mean': ps1.mean, 'PS1_std': ps1.std, 'PS1_min': ps1.min, 'PS1_max': ps1.max,
        'PS2_mean': ps2.mean, 'PS2_std': ps2.std, 'PS2_min': ps2.min, 'PS2_max': ps2.max,
        'PS3_mean': ps3.mean, 'PS3_std': ps3.std, 'PS3_min': ps3.min, 'PS3_max': ps3.max,
        'TS1_mean': ts1.mean, 'TS1_std': ts1.std, 'TS1_min': ts1.min, 'TS1_max': ts1.max,
        'TS2_mean': ts2.mean, 'TS2_std': ts2.std, 'TS2_min': ts2.min, 'TS2_max': ts2.max,
        'VS1_mean': vs1.mean, 'VS1_std': vs1.std, 'VS1_min': vs1.min, 'VS1_max': vs1.max,
    };
}

export const AIAdvisor = ({ simulationData, onPrediction }: AIAdvisorProps) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setPrediction(null);
    onPrediction(null);
    setError(null);
    const features = calculateFeaturesFromData(simulationData);
    if (!features) {
        setError("Not enough simulation data to run analysis.");
        setIsAnalyzing(false);
        return;
    }
    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to get a prediction.');
        }
        const result: PredictionResponse = await response.json();
        setPrediction(result);
        onPrediction(result);
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsAnalyzing(false);
    }
  };
  
  const getSeverityStyling = (severity: string) => {
    const styles = {
      critical: { badge: 'bg-red-500', border: 'border-red-500' },
      high: { badge: 'bg-orange-500', border: 'border-orange-500' },
      medium: { badge: 'bg-yellow-400 text-black', border: 'border-yellow-400' },
      low: { badge: 'bg-green-500', border: 'border-green-500' },
      default: { badge: 'bg-gray-500', border: 'border-gray-500' }
    };
    return styles[severity as keyof typeof styles] || styles.default;
  };
  
  const renderExplanation = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Brain /> AI Diagnostic Advisor</CardTitle>
            <Button onClick={runAnalysis} disabled={isAnalyzing || simulationData.length === 0} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Run ML Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>Analysis Failed:</strong> {error}<p className="text-xs mt-2">Please ensure the Python backend server is running.</p></AlertDescription></Alert>}
            {!error && !prediction && !isAnalyzing && <p className="text-sm text-center text-muted-foreground p-4">Click "Run ML Analysis" to get an explainable valve condition prediction.</p>}
        </CardContent>
      </Card>
      
      {isAnalyzing && <Card><CardContent className="p-8"><div className="space-y-4"><Skeleton className="h-6 w-1/2 mx-auto" /><Skeleton className="h-4 w-3/4 mx-auto" /><Skeleton className="h-4 w-2/3 mx-auto" /></div></CardContent></Card>}

      {prediction && (
         <Card className={`border-l-4 ${getSeverityStyling(prediction.severity).border}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /><CardTitle className="text-lg">System Condition: {prediction.label}</CardTitle></div>
                     <div className="flex items-center gap-2">
                        {/* <Badge className={`${getSeverityStyling(prediction.severity).badge} text-white`}>{prediction.severity.toUpperCase()}</Badge> */}
                        {/* <Badge variant="outline">{Math.round(parseFloat(prediction.confidence) * 100)}% confidence</Badge> */}
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {prediction.prediction_code !== 100 && (
                  <div>
                      <div className="flex items-center gap-2 mb-3"><Info className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-sm">Key Contributing Factors:</span></div>
                      <div className="space-y-3">
                          {prediction.explanations && prediction.explanations.map((text, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm p-3 bg-muted/50 rounded-md">
                              <AlertTriangle className={`h-4 w-4 mt-1 ${getSeverityStyling(prediction.severity).text} shrink-0`}/>
                              <p className="text-muted-foreground">{renderExplanation(text)}</p>
                            </div>
                          ))}
                      </div>
                  </div>
                )}
                <div>
                    <div className="flex items-center gap-2 mb-2"><Wrench className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-sm">Recommended Actions:</span></div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                        {prediction.remedy.map((action, idx) => <li key={idx}>{action}</li>)}
                    </ul>
                </div>
            </CardContent>
         </Card>
      )}
    </div>
  );
};