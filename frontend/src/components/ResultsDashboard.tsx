import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge, Zap, Settings, TrendingUp, Calculator } from "lucide-react";

export interface HydraulicResults {
  pumpFlowRate: number;        // L/min
  pumpDisplacement: number;    // cc/rev  
  cylinderArea: {
    bore: number;              // cm²
    rod: number;               // cm²
    annular: number;           // cm²
  };
  requiredPressure: {
    fastDown: number;          // bar
    workingCycle: number;      // bar
    holding: number;           // bar
    fastUp: number;            // bar
  };
  motorPower: number;          // kW
  maxReliefValve: number;      // bar
  energyConsumption: {
    total: number;             // kWh per cycle
    perPhase: {
      fastDown: number;
      workingCycle: number;
      holding: number;
      fastUp: number;
    };
  };
}

interface ResultsDashboardProps {
  results: HydraulicResults | null;
  isCalculating: boolean;
}

export const ResultsDashboard = ({ results, isCalculating }: ResultsDashboardProps) => {
  if (isCalculating) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="shadow-technical">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results) {
    return (
      <Card className="shadow-technical">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Run simulation to see results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: "Pump Flow Rate",
      value: results.pumpFlowRate.toFixed(2),
      unit: "L/min",
      icon: Gauge,
      color: "text-primary"
    },
    {
      title: "Pump Displacement",
      value: results.pumpDisplacement.toFixed(1),
      unit: "cc/rev",
      icon: Settings,
      color: "text-accent"
    },
    {
      title: "Motor Power",
      value: results.motorPower.toFixed(2),
      unit: "kW",
      icon: Zap,
      color: "text-warning"
    },
    {
      title: "Max Relief Valve",
      value: results.maxReliefValve.toFixed(0),
      unit: "bar",
      icon: TrendingUp,
      color: "text-destructive"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="shadow-technical hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {metric.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cylinder Areas */}
        <Card className="shadow-technical">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Cylinder Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bore Side Area:</span>
              <Badge variant="secondary">
                {results.cylinderArea.bore.toFixed(1)} cm²
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rod Side Area:</span>
              <Badge variant="secondary">
                {results.cylinderArea.rod.toFixed(1)} cm²
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annular Area:</span>
              <Badge variant="secondary">
                {results.cylinderArea.annular.toFixed(1)} cm²
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pressure Requirements */}
        <Card className="shadow-technical">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pressure Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fast Down:</span>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                {results.requiredPressure.fastDown.toFixed(0)} bar
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Working Cycle:</span>
              <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                {results.requiredPressure.workingCycle.toFixed(0)} bar
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Holding:</span>
              <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                {results.requiredPressure.holding.toFixed(0)} bar
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fast Up:</span>
              <Badge className="bg-success/10 text-success hover:bg-success/20">
                {results.requiredPressure.fastUp.toFixed(0)} bar
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Consumption */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            Energy Consumption Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {results.energyConsumption.total.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground">kWh/cycle</div>
              <div className="text-xs font-medium text-primary mt-1">Total</div>
            </div>
            
            <Separator orientation="vertical" className="hidden md:block" />
            
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:col-span-3">
              {Object.entries(results.energyConsumption.perPhase).map(([phase, energy]) => (
                <div key={phase} className="flex justify-between items-center p-2 rounded bg-card">
                  <span className="text-sm capitalize text-muted-foreground">
                    {phase.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className="font-mono text-sm">
                    {energy.toFixed(3)} kWh
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
