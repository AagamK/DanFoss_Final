export interface EnhancedSensorData {
  timestamp: string;
  time: number;
  pressure: number;
  flowRate: number;
  pumpInputPower: number;
  actualMotorInputPower: number;
  actuatorOutputPower: number;
  idealMotorInputPower: number;
  stroke: number;
  temperature: number;
  vibration: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface PowerMetrics {
  pumpInputPower: number;
  actualMotorInputPower: number;
  actuatorOutputPower: number;
  idealMotorInputPower: number;
}
