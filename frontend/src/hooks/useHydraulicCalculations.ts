import { useState, useCallback } from "react";
import { HydraulicParameters } from "@/components/HydraulicSimulator";
import { HydraulicResults } from "@/components/ResultsDashboard";

export interface SimulationDataPoint {
  time: number;
  stroke: number;
  velocity: number;
  pressure_rod: number;
  pressure_cap: number;
  flow: number;
  motorPower: number;
  actuatorPower: number;
  phase: string;
  pumpInputPower: number;
  actualMotorInputPower: number;
  actuatorOutputPower: number;
  idealMotorInputPower: number;
}

export const useHydraulicCalculations = (parameters: HydraulicParameters) => {
  const [results, setResults] = useState<HydraulicResults | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      if (parameters.motorRpm <= 0) { throw new Error("Motor RPM must be greater than zero."); }
      if (parameters.pumpEfficiency <= 0 || parameters.pumpEfficiency > 1) { throw new Error("Pump Efficiency must be between 0 and 1."); }
      
      const cylinderAreaBore = (Math.PI * Math.pow(parameters.cylinderBore / 1000, 2)) / 4;
      const rodArea = (Math.PI * Math.pow(parameters.rodDiameter / 1000, 2)) / 4;
      const annularArea = cylinderAreaBore - rodArea;
      const deadLoadN = parameters.deadLoad * 1000 * 9.81;
      const holdingLoadN = parameters.holdingLoad * 1000 * 9.81;
      const headLoss = parameters.systemLosses || 10;
      
      const pressureFastDown = deadLoadN / (cylinderAreaBore * 100000) + headLoss;
      const pressureWorkingCycle = holdingLoadN / (cylinderAreaBore * 100000) + headLoss;
      const pressureHolding = pressureWorkingCycle;
      const pressureFastUp = deadLoadN / (annularArea * 100000) + headLoss;
      
      const flowFastDown = cylinderAreaBore * (parameters.phases.fastDown.speed / 1000) * 60 * 1000;
      const flowWorkingCycle = cylinderAreaBore * (parameters.phases.workingCycle.speed / 1000) * 60 * 1000;
      const flowHolding = 0;
      const flowFastUp = annularArea * (parameters.phases.fastUp.speed / 1000) * 60 * 1000;
      
      const maxFlow = Math.max(flowFastDown, flowWorkingCycle, flowFastUp);
      const pumpFlowRate = maxFlow;
      const pumpDisplacement = (pumpFlowRate * 1000) / parameters.motorRpm ;
      
      const powerFastDownPump = (pressureFastDown * flowFastDown) / 600;
      const powerFastDownMotor = powerFastDownPump / parameters.pumpEfficiency;
      const powerWorkingCyclePump = (pressureWorkingCycle * flowWorkingCycle) / 600;
      const powerWorkingCycleMotor = powerWorkingCyclePump / parameters.pumpEfficiency;
      const powerHoldingMotor = 0; // Idle power can be added here if needed
      const powerFastUpPump = (pressureFastUp * flowFastUp) / 600;
      const powerFastUpMotor = powerFastUpPump / parameters.pumpEfficiency;
      
      const maxMotorPower = Math.max(powerFastDownMotor, powerWorkingCycleMotor, powerFastUpMotor);
      
      const energyFastDown = powerFastDownMotor * (parameters.phases.fastDown.time / 3600);
      const energyWorkingCycle = powerWorkingCycleMotor * (parameters.phases.workingCycle.time / 3600);
      const energyHolding = powerHoldingMotor * (parameters.phases.holding.time / 3600);
      const energyFastUp = powerFastUpMotor * (parameters.phases.fastUp.time / 3600);
      const totalEnergy = energyFastDown + energyWorkingCycle + energyHolding + energyFastUp;

      const actuatorPowerFastDown = (deadLoadN * (parameters.phases.fastDown.speed / 1000)) / 1000;
      const actuatorPowerWorking = (holdingLoadN * (parameters.phases.workingCycle.speed / 1000)) / 1000;
      const actuatorPowerFastUp = (deadLoadN * (parameters.phases.fastUp.speed / 1000)) / 1000;
      
      const maxWorkingPressure = Math.max(pressureFastDown, pressureWorkingCycle, pressureHolding, pressureFastUp);
      const reliefValvePressure = maxWorkingPressure * 1.2;
      
      const simulationDataPoints: SimulationDataPoint[] = [];
      const phases = [
        { name: 'fastDown', time: parameters.phases.fastDown.time, pressure: pressureFastDown, flow: flowFastDown, motorPower: powerFastDownMotor, actuatorPower: actuatorPowerFastDown, idealPower: powerFastDownPump },
        { name: 'workingCycle', time: parameters.phases.workingCycle.time, pressure: pressureWorkingCycle, flow: flowWorkingCycle, motorPower: powerWorkingCycleMotor, actuatorPower: actuatorPowerWorking, idealPower: powerWorkingCyclePump },
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0 },
        { name: 'fastUp', time: parameters.phases.fastUp.time, pressure: pressureFastUp, flow: flowFastUp, motorPower: powerFastUpMotor, actuatorPower: actuatorPowerFastUp, idealPower: powerFastUpPump }
      ];

      let currentTime = 0;
      let currentStroke = 0;
      
      phases.forEach(phase => {
        const phaseParams = parameters.phases[phase.name as keyof typeof parameters.phases];
        const timeStep = 0.25; 
        const dataPointsPerPhase = phase.time > 0 ? Math.ceil(phase.time / timeStep) : 1;

        for (let i = 0; i <= dataPointsPerPhase; i++) {
          const time = currentTime + (i * timeStep);
          if (time > currentTime + phase.time && phase.time > 0) continue; 
          
          const timeInPhase = i * timeStep;
          let strokeAtTime = currentStroke;
          const progress = phase.time > 0 ? Math.min(1, timeInPhase / phase.time) : 1;
          
          const curveFactor = 4 * (progress - progress * progress);
          
          if (phase.name === 'fastUp') { strokeAtTime -= phaseParams.stroke * progress; } 
          else { strokeAtTime += phaseParams.stroke * progress; }
          
          const pressureVariation = phase.pressure * 0.02 * curveFactor;
          const flowVariation = phase.flow * 0.02 * curveFactor;

          simulationDataPoints.push({
            time,
            flow: phase.flow - flowVariation,
            stroke: Math.max(0, strokeAtTime),
            pressure_cap: phase.pressure - pressureVariation,
            pressure_rod: phase.pressure * 0.2,
            velocity: (phase.name === 'fastUp' ? -1 : 1) * (phaseParams.speed / 1000) * (phase.name === 'holding' ? 0 : 1),
            motorPower: phase.motorPower, 
            actuatorPower: phase.actuatorPower,
            phase: phase.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
            pumpInputPower: phase.pressure * phase.flow / 600,
            actualMotorInputPower: phase.motorPower, // Typo corrected here
            actuatorOutputPower: phase.actuatorPower, 
            idealMotorInputPower: phase.idealPower
          });
        }
        
        currentStroke = simulationDataPoints[simulationDataPoints.length - 1].stroke;
        currentTime += phase.time;
      });

      const calculatedResults: HydraulicResults = {
        pumpFlowRate, pumpDisplacement,
        cylinderArea: { bore: cylinderAreaBore * 10000, rod: rodArea * 10000, annular: annularArea * 10000 },
        requiredPressure: { fastDown: pressureFastDown, workingCycle: pressureWorkingCycle, holding: pressureHolding, fastUp: pressureFastUp },
        motorPower: maxMotorPower, maxReliefValve: reliefValvePressure,
        energyConsumption: { total: totalEnergy, perPhase: { fastDown: energyFastDown, workingCycle: energyWorkingCycle, holding: energyHolding, fastUp: energyFastUp } }
      };
      
      setResults(calculatedResults);
      setSimulationData(simulationDataPoints);
    } catch (err) {
      console.error("Calculation error:", err);
      setError(err instanceof Error ? err.message : "An unknown calculation error occurred.");
      setResults(null);
      setSimulationData([]);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters]);

  return {
    results, setResults, simulationData, setSimulationData,
    isCalculating, runSimulation, error,
  };
};