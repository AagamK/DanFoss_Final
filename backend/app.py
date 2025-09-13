from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import shap
import os

app = Flask(__name__)
CORS(app)

# --- Load Model and Initialize Explainer ---
try:
    model = joblib.load('hydraulic_model.joblib')
    explainer = shap.TreeExplainer(model)
    print("Model and SHAP Explainer loaded successfully.")
except FileNotFoundError:
    print("Error: Model file 'hydraulic_model.joblib' not found. Please run train_model.py first.")
    model = None
    explainer = None

# --- Pre-calculate Normal Ranges ---
normal_ranges = {}
try:
    DATA_PATH = './data/'
    profile = pd.read_csv(os.path.join(DATA_PATH, 'profile.txt'), sep='\t', header=None)
    profile.columns = ['cooler_condition', 'valve_condition', 'pump_leakage', 'accumulator_pressure', 'stable_flag']
    
    sensors_to_process = ['PS1', 'PS2', 'PS3', 'TS1', 'TS2', 'VS1']
    all_features = []
    for sensor in sensors_to_process:
        file_path = os.path.join(DATA_PATH, f'{sensor}.txt')
        sensor_data = pd.read_csv(file_path, sep='\t', header=None)
        features = pd.DataFrame()
        features[f'{sensor}_mean'] = sensor_data.mean(axis=1)
        features[f'{sensor}_std'] = sensor_data.std(axis=1)
        features[f'{sensor}_min'] = sensor_data.min(axis=1)
        features[f'{sensor}_max'] = sensor_data.max(axis=1)
        all_features.append(features)
    
    features_df = pd.concat(all_features, axis=1)
    normal_data = features_df[profile['valve_condition'] == 100]
    
    for col in normal_data.columns:
        lower_bound = normal_data[col].quantile(0.05)
        upper_bound = normal_data[col].quantile(0.95)
        normal_ranges[col] = (lower_bound, upper_bound) # Store as tuple for comparison
    print("Normal operating ranges calculated.")

except Exception as e:
    print(f"Could not calculate normal ranges: {e}")

EXPECTED_FEATURES = list(normal_ranges.keys())

PREDICTION_MAP = {
    100: {"label": "Optimal", "severity": "low", "remedy": ["System is operating optimally."]},
    90: {"label": "Small Lag", "severity": "medium", "remedy": ["Inspect valve for contamination.", "Check pilot pressure."]},
    80: {"label": "Severe Lag", "severity": "high", "remedy": ["Schedule valve inspection.", "Check for internal leakage.", "Verify solenoid signal."]},
    73: {"label": "Close to Total Failure", "severity": "critical", "remedy": ["System shutdown recommended.", "Replace valve immediately."]}
}

# --- Function to generate text-based explanations ---
def generate_text_explanation(feature_name, value, normal_range_tuple):
    feature_parts = feature_name.replace('_', ' ').title().split()
    sensor = feature_parts[0]
    metric = " ".join(feature_parts[1:])
    
    if normal_range_tuple is None:
        return f"The {metric} of {sensor} was a significant factor."

    lower_bound, upper_bound = normal_range_tuple

    if value < lower_bound:
        return f"The **{metric} of {sensor}** was unusually **low** ({value:.2f}), falling below the normal range of {lower_bound:.2f} - {upper_bound:.2f}. This could indicate a leak or a loss of system pressure."
    elif value > upper_bound:
        return f"The **{metric} of {sensor}** was unusually **high** ({value:.2f}), exceeding the normal range of {lower_bound:.2f} - {upper_bound:.2f}. This might suggest a blockage or excessive system strain."
    else:
        return f"The **{metric} of {sensor}** ({value:.2f}) was within its normal range but still a key factor in the model's decision, possibly due to its interaction with other sensor readings."

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or explainer is None:
        return jsonify({'error': 'Model or Explainer not loaded'}), 500
    try:
        data = request.get_json()
        if not data or 'features' not in data:
            return jsonify({'error': 'Invalid input: "features" key missing'}), 400

        features_df = pd.DataFrame([data['features']], columns=EXPECTED_FEATURES)
        
        prediction_result = model.predict(features_df)
        prediction_proba = model.predict_proba(features_df)
        predicted_class = int(prediction_result[0])
        class_index = np.where(model.classes_ == predicted_class)[0][0]
        confidence = prediction_proba[0][class_index]

        shap_values_obj = explainer(features_df)
        shap_values_for_class = shap_values_obj.values[0, :, class_index]
        
        abs_shap_values = np.abs(shap_values_for_class)
        top_indices = np.argsort(abs_shap_values)[-3:][::-1]
        
        explanations = []
        for i in top_indices:
            feature_name = EXPECTED_FEATURES[i]
            value = features_df.iloc[0, i]
            normal_range = normal_ranges.get(feature_name)
            
            text_explanation = generate_text_explanation(feature_name, value, normal_range)
            explanations.append(text_explanation)

        response = PREDICTION_MAP.get(predicted_class, {})
        response.update({
            'confidence': f"{confidence:.2f}",
            'prediction_code': predicted_class,
            'explanations': explanations
        })
        return jsonify(response)
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)