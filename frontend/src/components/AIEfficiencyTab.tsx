import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Lightbulb } from "lucide-react";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import type { HydraulicResults } from "./ResultsDashboard";
import type { PredictionResponse } from "@/types/predictions";

interface AIEfficiencyTabProps {
  simulationData: SimulationDataPoint[];
  results: HydraulicResults | null;
  prediction: PredictionResponse | null;
}

export const AIEfficiencyTab = ({ simulationData, results, prediction }: AIEfficiencyTabProps) => {
  if (!simulationData || simulationData.length === 0 || !results) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb />Efficiency Insights</CardTitle></CardHeader>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Run a simulation and an ML analysis to get AI-powered efficiency suggestions.
        </CardContent>
      </Card>
    );
  }

  const totalActuatorEnergy = simulationData.reduce((acc, point, index) => {
    if (index === 0) return 0;
    const timeStep = point.time - simulationData[index - 1].time;
    return acc + (point.actuatorOutputPower * (timeStep / 3600));
  }, 0);

  const totalMotorEnergy = results.overallEfficiencyOp;
  const overallEfficiency = totalMotorEnergy;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap /> Overall Cycle Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{totalMotorEnergy.toFixed(1)}%</div>
          <p className="text-muted-foreground mt-2">
            Ratio of useful actuator work to total energy consumed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb />AI Suggestions for Efficiency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {prediction && prediction.prediction_code !== 100 ? (
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold">AI Observation: Valve performance shows a '{prediction.label}'.</p>
                    <p className="text-sm text-muted-foreground">This condition can lead to significant energy loss due to inefficient fluid control, slower cycle times, and the pump working harder to compensate for internal leakage or slow response.</p>
                    <p className="text-sm mt-2"><strong>Suggestion:</strong> A valve with suboptimal performance can increase energy consumption by **5-15%**. Prioritizing the recommended maintenance actions for the valve is crucial for restoring system efficiency and reducing operational costs.</p>
                </div>
            ) : (
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold">Observation: Efficiency is lowest during the 'Holding' phase.</p>
                    <p className="text-sm text-muted-foreground">This is because the motor may consume idle power while no work is being done.</p>
                    <p className="text-sm mt-2"><strong>Suggestion:</strong> Consider using a variable displacement pump or an accumulator to reduce power loss during holding periods.</p>
                </div>
            )}
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">Observation: The largest energy consumption occurs during high-speed movements.</p>
                <p className="text-sm text-muted-foreground">This is expected, but indicates the area with the most potential for savings.</p>
                <p className="text-sm mt-2"><strong>Suggestion:</strong> Ensure hydraulic lines and valves are appropriately sized to minimize pressure drops and energy loss as heat during these high-flow phases.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
