import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { HydraulicParameters } from "./HydraulicSimulator";

interface ParameterFormProps {
  parameters: HydraulicParameters;
  onParametersChange: (parameters: HydraulicParameters) => void;
}

export const ParameterForm = ({ parameters, onParametersChange }: ParameterFormProps) => {
  const updateParameter = (path: string, value: number) => {
    const newParams = { ...parameters };
    const keys = path.split('.');
    let current: any = newParams;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onParametersChange(newParams);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Parameters */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">System Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cylinderBore" className="text-sm font-medium">Cylinder Bore (mm)</Label>
              <Input
                id="cylinderBore"
                type="number"
                value={parameters.cylinderBore}
                onChange={(e) => updateParameter('cylinderBore', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rodDiameter" className="text-sm font-medium">Rod Diameter (mm)</Label>
              <Input
                id="rodDiameter"
                type="number"
                value={parameters.rodDiameter}
                onChange={(e) => updateParameter('rodDiameter', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadLoad" className="text-sm font-medium">Dead Load (Ton)</Label>
              <Input
                id="deadLoad"
                type="number"
                step="0.1"
                value={parameters.deadLoad}
                onChange={(e) => updateParameter('deadLoad', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="holdingLoad" className="text-sm font-medium">Holding Load (Ton)</Label>
              <Input
                id="holdingLoad"
                type="number"
                value={parameters.holdingLoad}
                onChange={(e) => updateParameter('holdingLoad', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="motorRpm" className="text-sm font-medium">Motor Speed (RPM)</Label>
              <Input
                id="motorRpm"
                type="number"
                value={parameters.motorRpm}
                onChange={(e) => updateParameter('motorRpm', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pumpEfficiency" className="text-sm font-medium">Pump Efficiency</Label>
              <Input
                id="pumpEfficiency"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parameters.pumpEfficiency}
                onChange={(e) => updateParameter('pumpEfficiency', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="systemLosses" className="text-sm font-medium">System Losses (bar)</Label>
            <Input
              id="systemLosses"
              type="number"
              value={parameters.systemLosses}
              onChange={(e) => updateParameter('systemLosses', Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Duty Cycle Parameters */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Duty Cycle Phases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fast Down */}
          <div>
            <h4 className="font-medium text-primary mb-3">Fast Down</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Speed (mm/s)</Label>
                <Input
                  type="number"
                  value={parameters.phases.fastDown.speed}
                  onChange={(e) => updateParameter('phases.fastDown.speed', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Stroke (mm)</Label>
                <Input
                  type="number"
                  value={parameters.phases.fastDown.stroke}
                  onChange={(e) => updateParameter('phases.fastDown.stroke', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Time (s)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={parameters.phases.fastDown.time}
                  onChange={(e) => updateParameter('phases.fastDown.time', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Working Cycle */}
          <div>
            <h4 className="font-medium text-warning mb-3">Working Cycle</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Speed (mm/s)</Label>
                <Input
                  type="number"
                  value={parameters.phases.workingCycle.speed}
                  onChange={(e) => updateParameter('phases.workingCycle.speed', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Stroke (mm)</Label>
                <Input
                  type="number"
                  value={parameters.phases.workingCycle.stroke}
                  onChange={(e) => updateParameter('phases.workingCycle.stroke', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Time (s)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={parameters.phases.workingCycle.time}
                  onChange={(e) => updateParameter('phases.workingCycle.time', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Holding */}
          <div>
            <h4 className="font-medium text-destructive mb-3">Holding</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Speed (mm/s)</Label>
                <Input
                  type="number"
                  value={parameters.phases.holding.speed}
                  onChange={(e) => updateParameter('phases.holding.speed', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Stroke (mm)</Label>
                <Input
                  type="number"
                  value={parameters.phases.holding.stroke}
                  onChange={(e) => updateParameter('phases.holding.stroke', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Time (s)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={parameters.phases.holding.time}
                  onChange={(e) => updateParameter('phases.holding.time', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Fast Up */}
          <div>
            <h4 className="font-medium text-success mb-3">Fast Up</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Speed (mm/s)</Label>
                <Input
                  type="number"
                  value={parameters.phases.fastUp.speed}
                  onChange={(e) => updateParameter('phases.fastUp.speed', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Stroke (mm)</Label>
                <Input
                  type="number"
                  value={parameters.phases.fastUp.stroke}
                  onChange={(e) => updateParameter('phases.fastUp.stroke', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Time (s)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={parameters.phases.fastUp.time}
                  onChange={(e) => updateParameter('phases.fastUp.time', Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};