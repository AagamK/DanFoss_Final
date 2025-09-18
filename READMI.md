# Danfoss Hydraulic System ML Project

## Machine Learning Implementation

### Model Creation and Training
The machine learning model in this project is created using the following steps:

1. **Data Collection**:
   - The system uses multiple sensor data files located in the `backend/data/` directory
   - Key sensors monitored: PS1, PS2, PS3, TS1, TS2, VS1 (pressure, temperature, and vibration sensors)
   - Target variable: valve_condition (from profile.txt)

2. **Feature Engineering**:
   - For each sensor, four statistical features are calculated:
     - Mean value
     - Standard deviation
     - Minimum value
     - Maximum value
   - This creates a rich set of features that capture the behavior of the hydraulic system

3. **Model Training**:
   - Algorithm: Random Forest Classifier
   - Training/Test Split: 80/20
   - Uses balanced class weights to handle any data imbalance
   - The model is trained to predict valve conditions with classes: 100 (Optimal), 90 (Small Lag), 80 (Severe Lag), 73 (Close to Total Failure)

### Model Usage in Application

1. **Backend Integration**:
   - The trained model is saved as `hydraulic_model.joblib`
   - Flask API loads this model to make real-time predictions
   - SHAP (SHapley Additive exPlanations) is used for model interpretability

2. **Prediction Process**:
   - API endpoint: `/predict`
   - Takes sensor readings as input
   - Returns:
     - Prediction (valve condition)
     - Confidence score
     - Explanations of the prediction
     - Remedial actions based on the predicted condition

3. **Smart Features**:
   - Normal operating ranges are pre-calculated for each sensor
   - Provides detailed explanations of why certain predictions were made
   - Includes severity levels and recommended remedies for each prediction

This ML system helps in predictive maintenance of hydraulic systems by detecting potential valve issues before they become critical failures.