import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeft, BarChart3, Settings, Brain } from "lucide-react";
import { ParameterForm, HydraulicParameters } from "@/components/ParameterForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { SimulationGraphs } from "@/components/SimulationGraphs";
import { useHydraulicCalculations } from "@/hooks/useHydraulicCalculations";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AIEfficiencyTab } from "@/components/AIEfficiencyTab";
import { AIAdvisor } from "@/components/AIAdvisor";
import type { PredictionResponse } from "@/types/predictions";


// Default parameters for the simulation
const defaultParameters: HydraulicParameters = {
  cylinderBore: 75,
  rodDiameter: 45,
  deadLoad: 2.5,
  holdingLoad: 8,
  motorRpm: 1800,
  pumpEfficiency: 0.9,
  systemLosses: 10,
  phases: {
    fastDown: { speed: 200, stroke: 200, time: 1 },
    workingCycle: { speed: 10, stroke: 50, time: 5 },
    holding: { speed: 0, stroke: 0, time: 2 },
    fastUp: { speed: 200, stroke: 250, time: 1.25 }
  }
};

export const HydraulicSimulator = () => {
  const navigate = useNavigate();
  const [parameters, setParameters] = useState<HydraulicParameters>(defaultParameters);
  const [activeTab, setActiveTab] = useState("parameters");
  const { results, simulationData, setSimulationData, isCalculating, runSimulation, error } = useHydraulicCalculations(parameters);
  
  // State for ML prediction results
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    if (error) {
      toast.error("Simulation Failed", { description: error });
    }
  }, [error]);

  const handleRunSimulation = () => {
    setPrediction(null); // Reset prediction on new simulation
    setSimulationData([]); 
    runSimulation();
    setActiveTab("results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                </Button>
            </div>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg"><Calculator className="h-8 w-8 text-primary" /></div>
                <div><h1 className="text-3xl font-bold text-foreground">Hydraulic Press Simulator</h1></div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4">
                    <Button onClick={handleRunSimulation} disabled={isCalculating}>
                      <Calculator className="h-4 w-4 mr-2" />
                      {isCalculating ? "Calculating..." : "Run Simulation"}
                    </Button>
                </div>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parameters"><Settings className="h-4 w-4 mr-2" />Parameters</TabsTrigger>
            <TabsTrigger value="results"><Calculator className="h-4 w-4 mr-2" />Results</TabsTrigger>
            <TabsTrigger value="graphs"><BarChart3 className="h-4 w-4 mr-2" />Graphs</TabsTrigger>
            <TabsTrigger value="aiDiagnostics"><Brain className="h-4 w-4 mr-2" />AI Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="mt-6">
            <ParameterForm parameters={parameters} onParametersChange={setParameters} />
          </TabsContent>
          <TabsContent value="results" className="mt-6">
            <ResultsDashboard results={results} isCalculating={isCalculating} />
          </TabsContent>
          <TabsContent value="graphs" className="mt-6">
            <SimulationGraphs data={simulationData} isLoading={isCalculating} />
          </TabsContent>
          <TabsContent value="aiDiagnostics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIAdvisor 
                simulationData={simulationData}
                onPrediction={setPrediction}
              />
              <AIEfficiencyTab 
                simulationData={simulationData}
                results={results}
                prediction={prediction}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

