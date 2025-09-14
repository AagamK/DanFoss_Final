import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeft, BarChart3, Settings, Brain, GitCompare, FileDown } from "lucide-react"; 
import { ParameterForm, HydraulicParameters } from "@/components/ParameterForm";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { SimulationGraphs } from "@/components/SimulationGraphs";
import { useHydraulicCalculations } from "@/hooks/useHydraulicCalculations";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AIEfficiencyTab } from "@/components/AIEfficiencyTab";
import { AIAdvisor } from "@/components/AIAdvisor";
import type { PredictionResponse } from "@/types/predictions";
import { CompareView } from "@/components/CompareView";
import type { EnhancedSensorData } from "@/types/hydraulicData";

// --- MODIFIED --- We only need these three for the export
import { svgAsPngUri } from 'save-svg-as-png';
import { usePDF } from '@react-pdf/renderer';
import { SimulationReport } from './SimulationReport'; 

// Default parameters (unchanged)
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

// Interface (unchanged)
export interface ComparisonDataPoint {
  time: number;
  idealPosition: number;
  actualPosition: number;
  positionError: number;
  idealVelocity: number;
  actualVelocity: number;
  velocityError: number;
  idealPressure: number;
  actualPressure: number;
  pressureError: number;
  idealFlow: number;
  actualFlow: number;
  flowError: number;
  idealPower: number;
  actualPower: number;
  powerError: number;
}

// Sine easing function (unchanged)
const easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2;

export const HydraulicSimulator = () => {
  const navigate = useNavigate();
  const [parameters, setParameters] = useState<HydraulicParameters>(defaultParameters);
  const [activeTab, setActiveTab] = useState("parameters");
  const { results, simulationData, setSimulationData, isCalculating, runSimulation, error } = useHydraulicCalculations(parameters);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // --- NEW --- This state will toggle our hidden, off-screen render portal
  const [isCapturing, setIsCapturing] = useState(false);

  const [pdfInstance, updatePdfInstance] = usePDF({
    document: <SimulationReport results={{}} parameters={defaultParameters} graphImages={[]} />,
  });

  useEffect(() => { if (error) { toast.error("Simulation Failed", { description: error }); } }, [error]);
  
  // Ideal metrics calculation logic (unchanged)
  useEffect(() => {
    if (simulationData && simulationData.length > 0) {
      const { phases, cylinderBore, rodDiameter, deadLoad, holdingLoad } = parameters;
      const areaCapEnd = Math.PI * Math.pow(cylinderBore / 2, 2);
      const areaRod = Math.PI * Math.pow(rodDiameter / 2, 2);
      const areaAnnulus = areaCapEnd - areaRod;
      const transitionDuration = 0.050; 
      const v1 = phases.fastDown.speed, v2 = phases.workingCycle.speed, v3 = 0, v4 = -phases.fastUp.speed;
      const p1_dur = phases.fastDown.time - (transitionDuration / 2), t1_dur = transitionDuration;
      const p2_dur = phases.workingCycle.time - (transitionDuration / 2), t2_dur = transitionDuration;
      const p3_dur = phases.holding.time - (transitionDuration / 2), t3_dur = transitionDuration;
      const p4_dur = phases.fastUp.time - (transitionDuration / 2);
      const t0=0.0, t1_p_end=t0+p1_dur, t1_t_end=t1_p_end+t1_dur, t2_p_end=t1_t_end+p2_dur, t2_t_end=t2_p_end+t2_dur;
      const t3_p_end=t2_t_end+p3_dur, t3_t_end=t3_p_end+t3_dur, t4_p_end=t3_t_end+p4_dur;
      const pos_p1_end=v1*p1_dur, pos_t1_end=pos_p1_end+((v1+v2)/2)*t1_dur, pos_p2_end=pos_t1_end+(v2*p2_dur);
      const pos_t2_end=pos_p2_end+((v2+v3)/2)*t2_dur, pos_p3_end=pos_t2_end+(v3*p3_dur), pos_t3_end=pos_p3_end+((v3+v4)/2)*t3_dur;

      const getIdealMetrics = (t: number) => {
        let idealPos = 0, idealVel = 0, idealPres = 0, idealFlow = 0, idealPower = 0;
        let loadN = 0, area_mm2 = areaCapEnd, isRetract = false;
        if (t <= t1_p_end) {
          idealVel=v1; idealPos=v1*t; loadN=deadLoad*9810; area_mm2=areaCapEnd;
        } else if (t <= t1_t_end) {
          const rt=(t-t1_p_end), p=rt/t1_dur, eP=easeInOutSine(p);
          idealVel=v1+(v2-v1)*eP;
          const intE=(rt/2)-(t1_dur*Math.sin(Math.PI*p))/(2*Math.PI);
          idealPos=pos_p1_end+(v1*rt)+(v2-v1)*intE;
          loadN=deadLoad*9810; area_mm2=areaCapEnd;
        } else if (t <= t2_p_end) {
          idealVel=v2; idealPos=pos_t1_end+v2*(t-t1_t_end); loadN=holdingLoad*9810; area_mm2=areaCapEnd;
        } else if (t <= t2_t_end) {
          const rt=(t-t2_p_end), p=rt/t2_dur, eP=easeInOutSine(p);
          idealVel=v2+(v3-v2)*eP;
          const intE=(rt/2)-(t2_dur*Math.sin(Math.PI*p))/(2*Math.PI);
          idealPos=pos_p2_end+(v2*rt)+(v3-v2)*intE;
          loadN=holdingLoad*9810; area_mm2=areaCapEnd;
        } else if (t <= t3_p_end) {
          idealVel=v3; idealPos=pos_t2_end; loadN=holdingLoad*9810; area_mm2=areaCapEnd;
        } else if (t <= t3_t_end) {
          const rt=(t-t3_p_end), p=rt/t3_dur, eP=easeInOutSine(p);
          idealVel=v3+(v4-v3)*eP;
          const intE=(rt/2)-(t3_dur*Math.sin(Math.PI*p))/(2*Math.PI);
          idealPos=pos_p3_end+(v3*rt)+(v4-v3)*intE;
          loadN=deadLoad*9810; area_mm2=areaAnnulus; isRetract=true;
        } else if (t <= t4_p_end) {
          idealVel=v4; idealPos=pos_t3_end+v4*(t-t3_t_end); loadN=deadLoad*9810; area_mm2=areaAnnulus; isRetract=true;
        } else { idealVel=0; idealPos=0; loadN=0; }
        if (isRetract) { idealPres=0; } else if (loadN>0) { idealPres=(loadN/area_mm2)*10; }
        idealFlow=Math.abs(area_mm2*(idealVel)*0.00006);
        if (idealFlow>0) { let pPres=idealPres; if (isRetract) { pPres=((loadN/areaAnnulus)*10); } idealPower=(pPres*idealFlow)/600; }
        return { idealPosition:Math.max(0,idealPos), idealVelocity:idealVel, idealPressure:idealPres, idealFlow:idealFlow, idealPower:idealPower };
      };
      const processedData = simulationData.map((dataPoint: EnhancedSensorData, index: number) => {
        const ideal=getIdealMetrics(dataPoint.time);
        let actualVelocity = 0;
        if (index>0) { const prev=simulationData[index-1], dt=dataPoint.time-prev.time, dPos=dataPoint.stroke-prev.stroke; if (dt>0) actualVelocity=dPos/dt; }
        const actual={actualPosition:dataPoint.stroke, actualVelocity:actualVelocity, actualPressure:dataPoint.pressure, actualFlow:dataPoint.flowRate, actualPower:dataPoint.actuatorOutputPower};
        return { time:dataPoint.time, ...ideal, ...actual,
          positionError:ideal.idealPosition-actual.actualPosition, velocityError:ideal.idealVelocity-actual.actualVelocity,
          pressureError:ideal.idealPressure-actual.actualPressure, flowError:ideal.idealFlow-actual.actualFlow,
          powerError:ideal.idealPower-actual.actualPower,
        };
      });
      setComparisonData(processedData);
    }
  }, [simulationData, parameters]);

  const handleRunSimulation = () => {
    setPrediction(null); setSimulationData([]); setComparisonData([]); runSimulation(); setActiveTab("results");
  };

  // Download trigger hook (unchanged)
  useEffect(() => {
    if (!isExporting || !pdfInstance.url) return;
    const link = document.createElement('a');
    link.href = pdfInstance.url;
    link.download = 'Hydraulic-Simulation-Report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report Exported");
    setIsExporting(false);
  }, [pdfInstance.url, isExporting]);


  // --- MODIFIED --- This is the new reliable export function.
  const handleExportPDF = async () => {
    setIsExporting(true);
    toast.info("Generating Report...", { description: "Rendering static charts..." });

    // 1. Set the 'isCapturing' state to true. This renders the hidden off-screen portal.
    setIsCapturing(true);

    // 2. Wait 1.5 seconds. This gives React time to render all 5 charts in the hidden portal.
    await new Promise(resolve => setTimeout(resolve, 1500));

    let graphImageUris: string[] = [];
    try {
      // 3. Find the portal and the SVGs inside it
      const portalElement = document.getElementById('capture-portal');
      if (!portalElement) {
        throw new Error("PDF capture portal failed to render.");
      }

      const svgElements = portalElement.querySelectorAll('svg');
      if (svgElements.length === 0) {
        throw new Error("No SVG charts found in the capture portal.");
      }

      // 4. Convert all 5 SVGs directly to PNG data strings
      const conversionPromises = Array.from(svgElements).map(svg => 
        svgAsPngUri(svg, { scale: 2, backgroundColor: '#FFFFFF' })
      );
      
      graphImageUris = await Promise.all(conversionPromises);

    } catch (err) {
      console.error(err);
      toast.error("Graph Conversion Failed", { description: err.message });
      setIsExporting(false);
      setIsCapturing(false); // Clean up the portal on failure
      return;
    }

    // 5. Success! Unmount the hidden portal.
    setIsCapturing(false);

    // 6. Generate the PDF with the array of 5 graph images.
    updatePdfInstance(
      <SimulationReport 
        results={results} 
        parameters={parameters} 
        graphImages={graphImageUris} 
      />
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header and Buttons (unchanged) */}
        <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                </Button>
            </div>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg"><Calculator className="h-8 w-8 text-primary" /></div>
                <div><h1 className="text-3xl font-bold text-foreground">Ideal vs. Actual Comparison</h1></div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4">
                    <Button onClick={handleRunSimulation} disabled={isCalculating}>
                      <Calculator className="h-4 w-4 mr-2" />
                      {isCalculating ? "Calculating..." : "Run Simulation"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleExportPDF} 
                      disabled={isExporting || isCalculating || simulationData.length === 0}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      {isExporting ? "Generating PDF..." : "Export PDF Report"}
                    </Button>
                </div>
            </div>
        </div>

        {/* Tabs (All wrapper IDs and forceMounts are GONE. This is now clean.) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="parameters"><Settings className="h-4 w-4 mr-2" />Parameters</TabsTrigger>
            <TabsTrigger value="results"><Calculator className="h-4 w-4 mr-2" />Results</TabsTrigger>
            <TabsTrigger value="graphs"><BarChart3 className="h-4 w-4 mr-2" />Graphs</TabsTrigger>
            <TabsTrigger value="compare"><GitCompare className="h-4 w-4 mr-2" />Compare</TabsTrigger>
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
          <TabsContent value="compare" className="mt-6">
             <CompareView comparisonData={comparisonData} />
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

      {/* --- NEW --- This is the hidden portal for capturing graph images --- */}
      {/* It renders off-screen when you click export, then vanishes */}
      {isCapturing && (
          <div 
            id="capture-portal" 
            style={{
              position: 'absolute', 
              left: '-9999px', // Moves it off-screen
              top: 0,
              width: '1200px', // Give it a realistic width to render properly
              backgroundColor: 'white', // Ensure it has a solid background
            }}
          >
              <CompareView comparisonData={comparisonData} />
          </div>
      )}
    </div>
  );
};