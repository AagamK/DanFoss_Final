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
  return (Math.random() * 0.10) + 0.10;
}

// --- HELPER 2: Fluctuation logic (Unchanged) ---
function applyFluctuationLogic(
  idealValue: number, 
  maxValueForAmplitude: number, 
  errorPercent: number, 
  isFluctuationPeriod: boolean, 
  phaseProgress: number
): number {
  if (!isFluctuationPeriod || errorPercent === 0) {
    return idealValue;
  }
  let envelope = 0;
  if (phaseProgress <= 0.05) {
    const progressInWindow = phaseProgress / 0.05;
    envelope = Math.sin(progressInWindow * Math.PI);
  } else if (phaseProgress >= 0.95) {
    const progressInWindow = (phaseProgress - 0.95) / 0.05;
    envelope = Math.sin(progressInWindow * Math.PI);
  }
  const frequency = 90;
  const oscillation = Math.sin(phaseProgress * frequency * 2 * Math.PI);
  const maxAmplitude = maxValueForAmplitude * errorPercent; 
  const currentAmplitude = maxAmplitude * envelope;
  return idealValue + (currentAmplitude * oscillation);
}

// --- HELPER 3: Easing function for smooth curves (Unchanged) ---
function easeValue(startValue: number, endValue: number, progress: number): number {
  const easedProgress = (1 - Math.cos(progress * Math.PI)) / 2;
  return startValue + (endValue - startValue) * easedProgress;
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
      // --- Initial Calculations (unchanged) ---
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
      
      const powerFastDownPump = (pressureFastDown * flowFastDown) / 600;
      const powerFastDownMotor = powerFastDownPump / parameters.pumpEfficiency;
      const powerWorkingCyclePump = (pressureWorkingCycle * flowWorkingCycle) / 600;
      const powerWorkingCycleMotor = powerWorkingCyclePump / parameters.pumpEfficiency;
      const powerHoldingMotor = (pressureWorkingCycle * flowWorkingCycle) / 600;; 
      const powerIdle = (pressureWorkingCycle * flowWorkingCycle) / 600;;
      const powerFastUpPump = (pressureFastUp * flowFastUp) / 600;
      const powerFastUpMotor = powerFastUpPump / parameters.pumpEfficiency;
      
      const actuatorPowerFastDown = (deadLoadN * (parameters.phases.fastDown.speed / 1000)) / 1000;
      const actuatorPowerWorking = (holdingLoadN * (parameters.phases.workingCycle.speed / 1000)) / 1000;
      const actuatorPowerFastUp = (deadLoadN * (parameters.phases.fastUp.speed / 1000)) / 1000;

      const maxFlow = Math.max(flowFastDown, flowWorkingCycle, flowFastUp);
      const pumpFlowRate = maxFlow;
      const pumpDisplacement = (pumpFlowRate * 1000) / parameters.motorRpm;

      const maxWorkingPressure = Math.max(pressureFastDown, pressureWorkingCycle, pressureHolding, pressureFastUp);
      const maxMotorPower = Math.max(powerFastDownMotor, powerWorkingCycleMotor, powerFastUpMotor);
      const maxActuatorPower = Math.max(actuatorPowerFastDown, actuatorPowerWorking, actuatorPowerFastUp);
      const maxSpeed = Math.max(parameters.phases.fastDown.speed, parameters.phases.workingCycle.speed, parameters.phases.fastUp.speed);
      const maxStroke = parameters.strokeLength;
      const reliefValvePressure = maxWorkingPressure * 1.2;

      const energyFastDown = powerFastDownMotor * (parameters.phases.fastDown.time );
      const energyWorkingCycle = powerWorkingCycleMotor * (parameters.phases.workingCycle.time );
      const energyHolding = powerHoldingMotor * (parameters.phases.holding.time );
      const energyFastUp = powerFastUpMotor * (parameters.phases.fastUp.time );
      const energyIdle = powerHoldingMotor * 4 ;
      const totalEnergy = energyFastDown + energyWorkingCycle + energyHolding + energyFastUp + energyIdle;

      const effFastDown = (actuatorPowerFastDown / powerFastDownMotor) *100;
      const effWorking = (actuatorPowerWorking / powerWorkingCycleMotor) *100;
      const effHolding = 0;
      const effFastUp = (actuatorPowerFastUp / powerFastUpMotor) *100;
      const effIdle = 0 ;
      const totalEff = ((totalEnergy > 0) ? ((actuatorPowerFastDown * parameters.phases.fastDown.time + actuatorPowerWorking * parameters.phases.workingCycle.time + actuatorPowerFastUp * parameters.phases.fastUp.time) / totalEnergy) : 0) *100;

      const totalActuatorOpPower = actuatorPowerFastDown  + actuatorPowerWorking  + actuatorPowerFastUp  ;
      const totalPumpOpPower = (powerFastDownPump + powerWorkingCyclePump  + powerFastUpPump  + powerHoldingMotor+ powerIdle) ;
      const overEff = parameters.pumpEfficiency * ( totalActuatorOpPower / totalPumpOpPower) *100;


      // --- End of calculations ---

      const idealDataPoints: SimulationDataPoint[] = [];
      const actualDataPoints: SimulationDataPoint[] = [];

      // Add speed/stroke to phase data for easier looping
      const phases = [
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0, speed: 0, stroke: 0 },
        { name: 'fastDown', time: parameters.phases.fastDown.time, pressure: pressureFastDown, flow: flowFastDown, motorPower: powerFastDownMotor, actuatorPower: actuatorPowerFastDown, idealPower: powerFastDownPump, speed: parameters.phases.fastDown.speed, stroke: parameters.phases.fastDown.stroke },
        { name: 'workingCycle', time: parameters.phases.workingCycle.time, pressure: pressureWorkingCycle, flow: flowWorkingCycle, motorPower: powerWorkingCycleMotor, actuatorPower: actuatorPowerWorking, idealPower: powerWorkingCyclePump, speed: parameters.phases.workingCycle.speed, stroke: parameters.phases.workingCycle.stroke },
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0, speed: 0, stroke: 0 },
        { name: 'fastUp', time: parameters.phases.fastUp.time, pressure: pressureFastUp, flow: flowFastUp, motorPower: powerFastUpMotor, actuatorPower: actuatorPowerFastUp, idealPower: powerFastUpPump, speed: -parameters.phases.fastUp.speed, stroke: -parameters.phases.fastUp.stroke },
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0, speed: 0, stroke: 0 },
      ];

      let currentTime = 0;
      let currentStroke = 0;

      const timeStepQuiet = 0.25; 
      const timeStepFluctuation = 0.01;
      const transitionDuration = 0.2; // 0.2-second curve between phases

      for (let i = 0; i < phases.length; i++) {
        const currentPhase = phases[i];
        const nextPhase = phases[i + 1] || currentPhase; 

        const phaseDuration = currentPhase.time;
        const phaseEndTime = currentTime + phaseDuration;

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

          let currentErrorPercent = 0;
          if (progress <= 0.05) {
            currentErrorPercent = startErrorPercent;
          } else if (progress >= 0.95) {
            currentErrorPercent = endErrorPercent;
          }
          
          const phaseNameString = currentPhase.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          
          // --- 1. CALCULATE & PUSH "IDEAL" (STEPPED) DATA ---
          // This is the "digital command" signal for the Graphs page. It has NO curves.
          const idealSteppedStroke = currentStroke + (currentPhase.stroke * progress);

          idealDataPoints.push({
            time,
            flow: currentPhase.flow, // Use the raw, stepped phase value
            stroke: Math.max(0, idealSteppedStroke),
            pressure_cap: currentPhase.pressure, // Use the raw, stepped phase value
            pressure_rod: currentPhase.pressure * 0.2,
            velocity: currentPhase.speed, // Use the raw, stepped phase value
            motorPower: currentPhase.motorPower,
            actuatorPower: currentPhase.actuatorPower,
            phase: phaseNameString,
            pumpInputPower: currentPhase.idealPower,
            actualMotorInputPower: currentPhase.motorPower,
            actuatorOutputPower: currentPhase.actuatorPower,
            idealMotorInputPower: currentPhase.idealPower
          });


          // --- 2. CALCULATE "ACTUAL" (CURVED + FLUCTUATING) DATA ---
          // This creates the "analog reality" for the Compare page.

          // Start with the raw values.
          let analogPressure = currentPhase.pressure;
          let analogFlow = currentPhase.flow;
          let analogSpeed = currentPhase.speed;
          let analogMotorPower = currentPhase.motorPower;
          let analogActuatorPower = currentPhase.actuatorPower;

          // Check if we are in the transition window and apply the curve.
          const timeUntilPhaseEnd = phaseEndTime - time;
          if (timeUntilPhaseEnd <= transitionDuration && i < phases.length - 1) {
            // We are at the end of a phase; ease into the *next* phase's values.
            const transitionProgress = (transitionDuration - timeUntilPhaseEnd) / transitionDuration;
            
            analogPressure = easeValue(currentPhase.pressure, nextPhase.pressure, transitionProgress);
            analogFlow = easeValue(currentPhase.flow, nextPhase.flow, transitionProgress);
            analogSpeed = easeValue(currentPhase.speed, nextPhase.speed, transitionProgress);
            analogMotorPower = easeValue(currentPhase.motorPower, nextPhase.motorPower, transitionProgress);
            analogActuatorPower = easeValue(currentPhase.actuatorPower, nextPhase.actuatorPower, transitionProgress);
          }

          // Now, apply fluctuation logic *on top of* the (potentially curved) analog values.
          const actualFlow = applyFluctuationLogic(analogFlow, maxFlow, currentErrorPercent, isFluctuationPeriod, progress);
          const actualPressure = applyFluctuationLogic(analogPressure, maxWorkingPressure, currentErrorPercent, isFluctuationPeriod, progress);
          const actualVelocity = applyFluctuationLogic(analogSpeed, maxSpeed, currentErrorPercent, isFluctuationPeriod, progress);
          const actualStroke = applyFluctuationLogic(idealSteppedStroke, maxStroke, currentErrorPercent, isFluctuationPeriod, progress); // Stroke base is always the linear ideal
          const actualMotorInputPower = applyFluctuationLogic(analogMotorPower, maxMotorPower, currentErrorPercent, isFluctuationPeriod, progress);
          const actualActuatorOutputPower = applyFluctuationLogic(analogActuatorPower, maxActuatorPower, currentErrorPercent, isFluctuationPeriod, progress);


          // --- 3. PUSH "ACTUAL" DATA ---
          actualDataPoints.push({
            time,
            flow: actualFlow,
            stroke: Math.max(0, actualStroke),
            pressure_cap: actualPressure,
            pressure_rod: actualPressure * 0.2, // Rod pressure based on fluctuating cap pressure
            velocity: actualVelocity,
            motorPower: actualMotorInputPower,
            actuatorPower: actualActuatorOutputPower,
            phase: phaseNameString,
            pumpInputPower: currentPhase.idealPower, 
            actualMotorInputPower: actualMotorInputPower,
            actuatorOutputPower: actualActuatorOutputPower,
            idealMotorInputPower: currentPhase.idealPower 
          });

          // --- 4. DYNAMIC TIMESTEP ---
          if (isFluctuationPeriod && phaseDuration > 0) {
            timeInPhase += timeStepFluctuation;
          } else {
            timeInPhase += timeStepQuiet;
          }

          if (phaseDuration <= 0) {
            break;
          }
        }
        
        currentStroke += currentPhase.stroke; // Move to the end of the ideal stroke
        currentTime = phaseEndTime; // Set time exactly to the end
      }

      const calculatedResults: HydraulicResults = {
        pumpFlowRate,
        pumpDisplacement,
        cylinderArea: { bore: cylinderAreaBore * 10000, rod: rodArea * 10000, annular: annularArea * 10000 },
        requiredPressure: { fastDown: pressureFastDown, workingCycle: pressureWorkingCycle, holding: pressureHolding, fastUp: pressureFastUp },
        motorPower: maxMotorPower, maxReliefValve: reliefValvePressure,
        overallEfficiencyOp: overEff,
        energyeff:{total: totalEff, perPhase: {idle: effIdle, fastDown: effFastDown, workingCycle: effWorking, holding: effHolding, fastUp: effFastUp }},
        energyConsumption: { total: totalEnergy, perPhase: {idle:energyIdle , fastDown: energyFastDown, workingCycle: energyWorkingCycle, holding: energyHolding, fastUp: energyFastUp } }
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

  return {
    results, setResults, 
    idealSimulationData,    // Clean, "stepped" data for Graphs page
    actualSimulationData,   // Curved, "analog," fluctuating data for Compare page
    setSimulationData: setIdealSimulationData, // For compatibility
    isCalculating, runSimulation, error,
  };
};