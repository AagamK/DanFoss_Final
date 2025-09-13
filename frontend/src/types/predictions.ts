export interface PredictionResponse {
    label: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    remedy: string[];
    confidence: string;
    prediction_code: number;
    // This is now a list of strings for the text-based explanations
    explanations: string[];
}