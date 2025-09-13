import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { useMemo } from "react";
import { AlertTriangle, BarChart2, Lightbulb, Wrench, Zap, Gauge } from "lucide-react";

interface SensorComparisonProps {
  sensorOneData: SimulationDataPoint[];
  sensorTwoData: SimulationDataPoint[];
  isLoading: boolean;
}

// A simplified recommendation type for this component
interface Recommendation {
  severity: 'low' | 'medium' | 'high';
  title: string;
  remedy: string[];
}

// A new type for our holistic performance scorecard
interface PerformanceScorecard {
  energyEfficiency: number; // kWh per 100mm stroke
  productivity: number; // mm/s
  pressureStability: number; // Standard deviation in bar
  totalEnergy: number; // kWh
}

// This function now calculates the complete scorecard
const generatePerformanceScorecard = (data: SimulationDataPoint[]): PerformanceScorecard => {
  if (!data || data.length < 2) {
    return { energyEfficiency: 0, productivity: 0, pressureStability: 0, totalEnergy: 0 };
  }

  const totalTime = data[data.length - 1].time - data[0].time;
  const totalStroke = data.reduce((acc, point, index) => {
    if (index === 0) return 0;
    const strokeChange = Math.abs(point.stroke - data[index - 1].stroke);
    return acc + strokeChange;
  }, 0);

  const totalMotorEnergy = data.reduce((acc, point, index) => {
    if (index === 0) return 0;
    const timeStep = point.time - data[index - 1].time;
    return acc + (point.motorPower * (timeStep / 3600));
  }, 0);

  // 1. Energy Efficiency (kWh per 100mm of total stroke)
  const energyEfficiency = totalStroke > 0 ? (totalMotorEnergy / totalStroke) * 100 : 0;

  // 2. Productivity (Average speed over the whole cycle)
  const productivity = totalTime > 0 ? totalStroke / totalTime : 0;

  // 3. Pressure Stability (Standard Deviation of Cap Pressure)
  const pressures = data.map(p => p.pressure_cap);
  const meanPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  const pressureVariance = pressures.reduce((acc, p) => acc + Math.pow(p - meanPressure, 2), 0) / pressures.length;
  const pressureStability = Math.sqrt(pressureVariance);

  return { energyEfficiency, productivity, pressureStability, totalEnergy: totalMotorEnergy };
};

const analyzeDataForIssues = (data: SimulationDataPoint[]): Recommendation[] => {
  if (!data || data.length === 0) return [];
  const issues: Recommendation[] = [];
  const maxPressure = Math.max(...data.map(d => d.pressure_cap));
  
  if (maxPressure > 200) {
    issues.push({
      severity: 'high',
      title: 'Excessive Pressure Spikes',
      remedy: ['Check relief valve settings.', 'Inspect for hydraulic line blockages.'],
    });
  }
  
  const { pressureStability } = generatePerformanceScorecard(data);
  if (pressureStability > 20) {
      issues.push({
          severity: 'medium',
          title: 'High Pressure Fluctuation',
          remedy: ['Check for air in the system (bleed hydraulics).', 'Inspect pump for inconsistent output.'],
      });
  }

  if (issues.length === 0) {
    issues.push({
        severity: 'low',
        title: 'Nominal Performance',
        remedy: ['All key metrics are within standard operating parameters.'],
    });
  }
  return issues;
};

const ComparisonColumn = ({ title, scorecard, issues }: { title: string, scorecard: PerformanceScorecard, issues: Recommendation[] }) => {
    const getSeverityColor = (severity: string) => ({
      'high': 'border-red-500', 'medium': 'border-yellow-500', 'low': 'border-green-500'
    }[severity] || 'border-gray-300');

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center text-foreground">{title}</h2>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart2 />Performance Scorecard</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {/* <div>
                        <p className="text-sm font-medium text-muted-foreground">Energy Efficiency</p>
                        <p className="text-2xl font-bold">{scorecard.energyEfficiency.toFixed(3)} <span className="text-sm font-normal">kWh / 100mm</span></p>
                    </div> */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Productivity</p>
                        <p className="text-2xl font-bold">{scorecard.productivity.toFixed(2)} <span className="text-sm font-normal">mm/s</span></p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Pressure Stability</p>
                        <p className="text-2xl font-bold">{scorecard.pressureStability.toFixed(2)} <span className="text-sm font-normal">bar (Std Dev)</span></p>
                    </div>
                </CardContent>
            </Card>
            <Card className="flex-grow">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle />Diagnostics</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {issues.map((issue: Recommendation, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${getSeverityColor(issue.severity)} bg-muted/50`}>
                            <p className="font-semibold">{issue.title}</p>
                            <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                                <Wrench className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{issue.remedy.join(' ')}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export const DetailedSensorComparison = ({ sensorOneData, sensorTwoData, isLoading }: SensorComparisonProps) => {
  const scorecard1 = useMemo(() => generatePerformanceScorecard(sensorOneData), [sensorOneData]);
  const scorecard2 = useMemo(() => generatePerformanceScorecard(sensorTwoData), [sensorTwoData]);
  const issues1 = useMemo(() => analyzeDataForIssues(sensorOneData), [sensorOneData]);
  const issues2 = useMemo(() => analyzeDataForIssues(sensorTwoData), [sensorTwoData]);
  
  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (!sensorOneData.length || !sensorTwoData.length) {
    return (
      <Card><CardContent className="pt-6 text-center text-muted-foreground">Upload two sensor data files and click 'Compare' to see the analysis.</CardContent></Card>
    );
  }

  const energyWinner = scorecard1.energyEfficiency < scorecard2.energyEfficiency ? "Circuit 1" : "Circuit 2";
  const productivityWinner = scorecard1.productivity > scorecard2.productivity ? "Circuit 1" : "Circuit 2";

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ComparisonColumn title="Circuit 1 Analysis" scorecard={scorecard1} issues={issues1} />
            <ComparisonColumn title="Circuit 2 Analysis" scorecard={scorecard2} issues={issues2} />
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Lightbulb className="text-primary" />
                    Combined Analysis & Recommendations
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
                <p>
                    In terms of **Energy Efficiency**, <strong className="text-foreground">{energyWinner}</strong> performs better, consuming less energy for the same amount of work.
                </p>
                <p>
                    For **Productivity**, <strong className="text-foreground">{productivityWinner}</strong> is superior, completing the cycle faster on average.
                </p>
                {scorecard1.pressureStability > 20 || scorecard2.pressureStability > 20 ? (
                    <p>One or both systems show significant pressure instability. The system with the lower stability value ({Math.min(scorecard1.pressureStability, scorecard2.pressureStability).toFixed(2)} bar) is operating more smoothly, which reduces component wear and improves consistency. Addressing the diagnostics for the less stable system is recommended.</p>
                ) : (
                    <p>Both systems demonstrate good pressure stability, indicating smooth operation and well-managed hydraulic forces.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
};