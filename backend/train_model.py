import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# --- 1. Data Loading ---
# Define the path to your data folder
DATA_PATH = './data/'

# Load the target labels (the health status of components)
try:
    profile = pd.read_csv(os.path.join(DATA_PATH, 'profile.txt'), sep='\t', header=None)
    profile.columns = ['cooler_condition', 'valve_condition', 'pump_leakage', 'accumulator_pressure', 'stable_flag']
except FileNotFoundError:
    print(f"Error: 'profile.txt' not found in '{DATA_PATH}' directory.")
    print("Please ensure you have completed Step 1 correctly.")
    exit()

# We will train the model to predict the 'valve_condition'
target = profile['valve_condition']

# --- 2. Feature Engineering ---
# We'll create statistical features from a few key sensor readings
sensors_to_process = ['PS1', 'PS2', 'PS3', 'TS1', 'TS2', 'VS1']
all_features = []

print("Starting feature engineering...")
for sensor in sensors_to_process:
    file_path = os.path.join(DATA_PATH, f'{sensor}.txt')
    if os.path.exists(file_path):
        print(f"Processing {sensor} data...")
        sensor_data = pd.read_csv(file_path, sep='\t', header=None)
        
        # Calculate statistical features (mean, std, min, max) for each cycle
        features = pd.DataFrame()
        features[f'{sensor}_mean'] = sensor_data.mean(axis=1)
        features[f'{sensor}_std'] = sensor_data.std(axis=1)
        features[f'{sensor}_min'] = sensor_data.min(axis=1)
        features[f'{sensor}_max'] = sensor_data.max(axis=1)
        all_features.append(features)
    else:
        print(f"Warning: Data file for sensor {sensor} not found. Skipping.")

if not all_features:
    print("Error: No sensor data files found. Cannot create features.")
    exit()

# Combine all generated features into one table
features_df = pd.concat(all_features, axis=1)
print("\nFeature engineering complete.")
print(f"Total samples: {len(features_df)}")

# --- 3. Model Training ---
# Split data into a training set and a testing set
X_train, X_test, y_train, y_test = train_test_split(
    features_df, 
    target, 
    test_size=0.2, 
    random_state=42,
    stratify=target # Ensures the split has a similar distribution of classes
)

# Initialize the Random Forest Classifier.
# `class_weight='balanced'` helps the model learn from imbalanced data.
model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')

print("\nTraining model...")
model.fit(X_train, y_train)
print("Model training complete.")

# --- 4. Model Evaluation ---
# Use the trained model to make predictions on the test data
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# --- 5. Save the Trained Model ---
# This saves our trained model to a file so the API can use it later
model_filename = 'hydraulic_model.joblib'
joblib.dump(model, model_filename)
print(f"\nModel saved successfully as '{model_filename}'")