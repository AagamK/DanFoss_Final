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

// --- HELPER 1: Get random error percent (10% to 20%) ---
function getRandomErrorPercent(): number {
  // Returns a random float between 0.10 and 0.20
  return (Math.random() * 0.10) + 0.10;
}

// --- HELPER 2: Fluctuation logic (This logic is correct) ---
/**
 * Applies a high-frequency oscillation with a ramped envelope.
 * Amplitude is based on the 'maxValueForAmplitude' (the system max)
 * to ensure vibration is visible even in low-value phases.
 */
function applyFluctuationLogic(
  idealValue: number, 
  maxValueForAmplitude: number, // System-wide max value
  errorPercent: number, 
  isFluctuationPeriod: boolean, 
  phaseProgress: number
): number {

  // If we are not in the fluctuation period or there's no error, return the perfect ideal value.
  if (!isFluctuationPeriod || errorPercent === 0) {
    return idealValue;
  }

  // 1. CALCULATE THE AMPLITUDE ENVELOPE (The Ramp: 0 -> 1 -> 0)
  let envelope = 0;
  if (phaseProgress <= 0.05) {
    const progressInWindow = phaseProgress / 0.05; // Map to [0.0, 1.0]
    envelope = Math.sin(progressInWindow * Math.PI); // Get the 0->1 ramp
  } else if (phaseProgress >= 0.95) {
    const progressInWindow = (phaseProgress - 0.95) / 0.05; // Map to [0.0, 1.0]
    envelope = Math.sin(progressInWindow * Math.PI); // Get the 1->0 ramp
  }

  // 2. CALCULATE THE CARRIER WAVE (The fast oscillation)
  const frequency = 90; // How fast it vibrates
  const oscillation = Math.sin(phaseProgress * frequency * 2 * Math.PI);

  // 3. COMBINE THEM
  const maxAmplitude = maxValueForAmplitude * errorPercent; 
  const currentAmplitude = maxAmplitude * envelope; // Scale the amplitude by the ramp

  return idealValue + (currentAmplitude * oscillation);
}


export const useHydraulicCalculations = (parameters: HydraulicParameters) => {
  const [results, setResults] = useState<HydraulicResults | null>(null);
  
  const [idealSimulationData, setIdealSimulationData] = useState<SimulationDataPoint[]>([]);
  const [actualSimulationData, setActualSimulationData] = useState<SimulationDataPoint[]>([]);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000)); 
    try {
      // --- Initial Calculations ---
      if (parameters.motorRpm <= 0) { throw new Error("Motor RPM must be greater than zero."); }
      if (parameters.pumpEfficiency <= 0 || parameters.pumpEfficiency > 1) { throw new Error("Pump Efficiency must be between 0 and 1."); }
      
      const cylinderAreaBore = (Math.PI * Math.pow(parameters.cylinderBore / 1000, 2)) / 4;
      const rodArea = (Math.PI * Math.pow(parameters.rodDiameter / 1000, 2)) / 4;
      const annularArea = cylinderAreaBore - rodArea;
      const deadLoadN = parameters.deadLoad * 1000 * 9.81;
      const holdingLoadN = parameters.holdingLoad * 1000 * 9.81;
      const headLoss = parameters.systemLosses || 10;
      
      // Calculate phase-specific metrics
      const pressureFastDown = deadLoadN / (cylinderAreaBore * 100000) + headLoss;
      const pressureWorkingCycle = holdingLoadN / (cylinderAreaBore * 100000) + headLoss;
      const pressureHolding = pressureWorkingCycle;
      const pressureFastUp = deadLoadN / (annularArea * 100000) + headLoss;
      
      const flowFastDown = cylinderAreaBore * (parameters.phases.fastDown.speed / 1000) * 60 * 1000;
      const flowWorkingCycle = cylinderAreaBore * (parameters.phases.workingCycle.speed / 1000) * 60 * 1000;
      const flowHolding = 0;
      const flowFastUp = annularArea * (parameters.phases.fastUp.speed / 1000) * 60 * 1000;
      
      const powerFastDownPump = (pressureFastDown * flowFastDown) / 600;
      const powerFastDownMotor = powerFastDownPump / parameters.pumpEfficiency;
      const powerWorkingCyclePump = (pressureWorkingCycle * flowWorkingCycle) / 600;
      const powerWorkingCycleMotor = powerWorkingCyclePump / parameters.pumpEfficiency;
      const powerHoldingMotor = 0; 
      const powerFastUpPump = (pressureFastUp * flowFastUp) / 600;
      const powerFastUpMotor = powerFastUpPump / parameters.pumpEfficiency;
      
      const actuatorPowerFastDown = (deadLoadN * (parameters.phases.fastDown.speed / 1000)) / 1000;
      const actuatorPowerWorking = (holdingLoadN * (parameters.phases.workingCycle.speed / 1000)) / 1000;
      const actuatorPowerFastUp = (deadLoadN * (parameters.phases.fastUp.speed / 1000)) / 1000;

      // --- Calculate SYSTEM MAX values for fluctuation amplitude ---
      const maxFlow = Math.max(flowFastDown, flowWorkingCycle, flowFastUp);
      const pumpFlowRate = maxFlow; // This is the value for the results object
      const pumpDisplacement = (pumpFlowRate * 1000) / parameters.motorRpm; // This is the value for the results object

      const maxWorkingPressure = Math.max(pressureFastDown, pressureWorkingCycle, pressureHolding, pressureFastUp);
      const maxMotorPower = Math.max(powerFastDownMotor, powerWorkingCycleMotor, powerFastUpMotor);
      const maxActuatorPower = Math.max(actuatorPowerFastDown, actuatorPowerWorking, actuatorPowerFastUp);
      const maxSpeed = Math.max(parameters.phases.fastDown.speed, parameters.phases.workingCycle.speed, parameters.phases.fastUp.speed);
      const maxStroke = parameters.strokeLength; // <-- THIS WAS THE MISSING VARIABLE
      const reliefValvePressure = maxWorkingPressure * 1.2;

      // Energy calculations
      const energyFastDown = powerFastDownMotor * (parameters.phases.fastDown.time / 3600);
      const energyWorkingCycle = powerWorkingCycleMotor * (parameters.phases.workingCycle.time / 3600);
      const energyHolding = powerHoldingMotor * (parameters.phases.holding.time / 3600);
      const energyFastUp = powerFastUpMotor * (parameters.phases.fastUp.time / 3600);
      const totalEnergy = energyFastDown + energyWorkingCycle + energyHolding + energyFastUp;
      // --- End of calculations ---

      const idealDataPoints: SimulationDataPoint[] = [];
      const actualDataPoints: SimulationDataPoint[] = [];

      const phases = [
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0 },
        { name: 'fastDown', time: parameters.phases.fastDown.time, pressure: pressureFastDown, flow: flowFastDown, motorPower: powerFastDownMotor, actuatorPower: actuatorPowerFastDown, idealPower: powerFastDownPump },
        { name: 'workingCycle', time: parameters.phases.workingCycle.time, pressure: pressureWorkingCycle, flow: flowWorkingCycle, motorPower: powerWorkingCycleMotor, actuatorPower: actuatorPowerWorking, idealPower: powerWorkingCyclePump },
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0 },
        { name: 'fastUp', time: parameters.phases.fastUp.time, pressure: pressureFastUp, flow: flowFastUp, motorPower: powerFastUpMotor, actuatorPower: actuatorPowerFastUp, idealPower: powerFastUpPump },
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0 },
      ];

      let currentTime = 0;
      let currentStroke = 0; // Tracks the IDEAL stroke

      const timeStepQuiet = 0.25; 
      const timeStepFluctuation = 0.01; // High-res timestep for vibration

      phases.forEach(phase => {
        const phaseParams = parameters.phases[phase.name as keyof typeof parameters.phases];
        const phaseDuration = phase.time;
        const phaseEndTime = currentTime + phaseDuration;

        // Generate a unique random error for the START and END of this specific phase
        const startErrorPercent = getRandomErrorPercent();
        const endErrorPercent = getRandomErrorPercent();

        let timeInPhase = 0.0;

        while (true) {
          const time = currentTime + timeInPhase;
          if (time > phaseEndTime && phaseDuration > 0) {
            break;
          }

          const progress = phaseDuration > 0 ? Math.min(1, timeInPhase / phaseDuration) : 1;
          const isFluctuationPeriod = (progress <= 0.05 || progress >= 0.95);

          // Select the correct error percentage for the current window
          let currentErrorPercent = 0;
          if (progress <= 0.05) {
            currentErrorPercent = startErrorPercent;
          } else if (progress >= 0.95) {
            currentErrorPercent = endErrorPercent;
          }

          // Calculate "Ideal" values
          const idealStrokeAtTime = currentStroke + (phase.name === 'fastUp' ? -phaseParams.stroke : phaseParams.stroke) * progress;
          const idealSpeed = (phase.name === 'fastUp' ? -1 : 1) * (phaseParams.speed) * (phase.name === 'holding' ? 0 : 1);
          const phaseNameString = phase.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

          // --- 1. PUSH IDEAL (CLEAN) DATA ---
          idealDataPoints.push({
            time,
            flow: phase.flow,
            stroke: Math.max(0, idealStrokeAtTime),
            pressure_cap: phase.pressure,
            pressure_rod: phase.pressure * 0.2,
            velocity: idealSpeed,
            motorPower: phase.motorPower,
            actuatorPower: phase.actuatorPower,
            phase: phaseNameString,
            pumpInputPower: phase.idealPower,
            actualMotorInputPower: phase.motorPower,
            actuatorOutputPower: phase.actuatorPower,
            idealMotorInputPower: phase.idealPower
          });

          // --- 2. APPLY FLUCTUATION LOGIC (Passes SYSTEM MAX values) ---
          const actualFlow = applyFluctuationLogic(phase.flow, maxFlow, currentErrorPercent, isFluctuationPeriod, progress);
          const actualPressure = applyFluctuationLogic(phase.pressure, maxWorkingPressure, currentErrorPercent, isFluctuationPeriod, progress);
          const actualVelocity = applyFluctuationLogic(idealSpeed, maxSpeed, currentErrorPercent, isFluctuationPeriod, progress);
          const actualMotorInputPower = applyFluctuationLogic(phase.motorPower, maxMotorPower, currentErrorPercent, isFluctuationPeriod, progress);
          const actualActuatorOutputPower = applyFluctuationLogic(phase.actuatorPower, maxActuatorPower, currentErrorPercent, isFluctuationPeriod, progress);
          // Stroke fluctuation is relative to the total possible stroke
          const actualStroke = applyFluctuationLogic(idealStrokeAtTime, maxStroke, currentErrorPercent, isFluctuationPeriod, progress);


          // --- 3. PUSH ACTUAL (FLUCTUATING) DATA ---
          actualDataPoints.push({
            time,
            flow: actualFlow,
            stroke: Math.max(0, actualStroke),
            pressure_cap: actualPressure,
            pressure_rod: actualPressure * 0.2,
            velocity: actualVelocity,
            motorPower: actualMotorInputPower,
            actuatorPower: actualActuatorOutputPower,
            phase: phaseNameString,
            pumpInputPower: phase.idealPower, 
            actualMotorInputPower: actualMotorInputPower,
            actuatorOutputPower: actualActuatorOutputPower,
            idealMotorInputPower: phase.idealPower 
          });

          // DYNAMIC TIMESTEP
          if (isFluctuationPeriod && phaseDuration > 0) {
            timeInPhase += timeStepFluctuation;
          } else {
            timeInPhase += timeStepQuiet;
          }

          if (phaseDuration <= 0) {
            break;
          }
        }
        
        currentStroke += (phase.name === 'fastUp' ? -phaseParams.stroke : phaseParams.stroke);
        currentTime = phaseEndTime;
      });

      // --- CRASH FIX: This object is now correct and references variables in scope ---
      const calculatedResults: HydraulicResults = {
        pumpFlowRate, // This is defined as maxFlow
        pumpDisplacement, // This is defined above
        cylinderArea: { bore: cylinderAreaBore * 10000, rod: rodArea * 10000, annular: annularArea * 10000 },
        requiredPressure: { fastDown: pressureFastDown, workingCycle: pressureWorkingCycle, holding: pressureHolding, fastUp: pressureFastUp },
        motorPower: maxMotorPower, maxReliefValve: reliefValvePressure,
        energyConsumption: { total: totalEnergy, perPhase: { fastDown: energyFastDown, workingCycle: energyWorkingCycle, holding: energyHolding, fastUp: energyFastUp } }
      };
      
      setResults(calculatedResults);
      setIdealSimulationData(idealDataPoints);
      setActualSimulationData(actualDataPoints);

    } catch (err) {
      console.error("Calculation error:", err);
      setError(err instanceof Error ? err.message : "An unknown calculation error occurred.");
      setResults(null);
      setIdealSimulationData([]);
      setActualSimulationData([]);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters]);

  // Export both data arrays
  return {
    results, setResults, 
    idealSimulationData,    // For the clean "Graphs" page
    actualSimulationData,   // For the fluctuating "Compare" page
    setSimulationData: setIdealSimulationData, // Kept for compatibility
    isCalculating, runSimulation, error,
  };
};