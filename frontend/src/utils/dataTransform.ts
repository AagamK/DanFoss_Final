import { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { EnhancedSensorData } from "@/types/hydraulicData";

export const transformSimulationData = (
  simulationData: SimulationDataPoint[]
): EnhancedSensorData[] => {
  return simulationData.map((point, index) => ({
    timestamp: new Date(Date.now() + index * 1000).toISOString(),
    time: point.time,
    pressure: point.pressure,
    flowRate: point.flow,
    pumpInputPower: point.pumpInputPower,
    actualMotorInputPower: point.actualMotorInputPower,
    actuatorOutputPower: point.actuatorOutputPower,
    idealMotorInputPower: point.idealMotorInputPower,
    stroke: point.stroke,
    temperature: 25 + Math.random() * 10,
    vibration: 0.001 + Math.random() * 0.01,
    status: point.phase,
  }));
};

export const generateSampleData = (): EnhancedSensorData[] => {
  const data: EnhancedSensorData[] = [];
  const phases = ["fastDown", "workingCycle", "holding", "fastUp"];
  const phaseData = {
    fastDown: { pressure: 150, flow: 120, pumpPower: 30, motorPower: 35, actuatorPower: 25, idealPower: 30 },
    workingCycle: { pressure: 200, flow: 80, pumpPower: 26.7, motorPower: 30, actuatorPower: 22, idealPower: 26.7 },
    holding: { pressure: 200, flow: 0, pumpPower: 0, motorPower: 2, actuatorPower: 0, idealPower: 0 },
    fastUp: { pressure: 180, flow: 100, pumpPower: 30, motorPower: 35, actuatorPower: 28, idealPower: 30 },
  };

  let totalTime = 0;
  let currentStroke = 0;

  phases.forEach((phase) => {
    const phaseInfo = phaseData[phase as keyof typeof phaseData];
    const durationInSeconds = phase === "fastDown" ? 5 : phase === "workingCycle" ? 10 : phase === "holding" ? 3 : 7;
    
    // This calculation ensures we generate 4 points per second (one every 0.25s)
    const pointsInPhase = durationInSeconds * 4; 

    for (let i = 0; i <= pointsInPhase; i++) {
      const progress = i / pointsInPhase;
      const curveFactor = Math.sin(progress * Math.PI); 

      if (phase === 'fastDown') currentStroke += 200 / pointsInPhase;
      else if (phase === 'workingCycle') currentStroke += 50 / pointsInPhase;
      else if (phase === 'fastUp') currentStroke -= 250 / pointsInPhase;
      currentStroke = Math.max(0, currentStroke);

      data.push({
        timestamp: new Date(Date.now() + totalTime * 1000).toISOString(),
        time: totalTime,
        pressure: phaseInfo.pressure + curveFactor * 10 + (Math.random() - 0.5) * 2,
        flowRate: phaseInfo.flow + curveFactor * 5 + (Math.random() - 0.5) * 2,
        pumpInputPower: phaseInfo.pumpPower + curveFactor * 2 + (Math.random() - 0.5),
        actualMotorInputPower: phaseInfo.motorPower + curveFactor * 2 + (Math.random() - 0.5),
        actuatorOutputPower: phaseInfo.actuatorPower + curveFactor * 2 + (Math.random() - 0.5),
        idealMotorInputPower: phaseInfo.idealPower + curveFactor * 2 + (Math.random() - 0.5),
        stroke: currentStroke,
        temperature: 45 + progress * 15 + (Math.random() - 0.5) * 3,
        vibration: 0.1 + Math.random() * 0.1,
        status: (phase === 'workingCycle' && progress > 0.5) ? 'warning' : 'normal',
      });

      // Precisely increment the time by 0.25 seconds
      totalTime += 0.25; 
    }
  });

  return data;
};