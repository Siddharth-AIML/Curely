# train_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
import joblib
import os

# Load dataset
print("Loading dataset...")
df = pd.read_csv("data/diseases.csv")

print("Dataset shape:", df.shape)
print("Columns:", df.columns[:10], "...")

# ✅ Select top 100 most frequent diseases
top_diseases = df["diseases"].value_counts().head(500).index
df = df[df["diseases"].isin(top_diseases)]

print(f"Filtered dataset shape: {df.shape}")
print(f"Unique diseases kept: {df['diseases'].nunique()}")

# Features = all symptom columns (drop 'diseases')
X = df.drop(columns=["diseases"])
y = df["diseases"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train model
model = MultinomialNB()
model.fit(X_train, y_train)

# Save model + feature names
os.makedirs("models", exist_ok=True)
joblib.dump((model, list(X.columns), list(top_diseases)), "models/disease_model.pkl")

print("✅ Model trained and saved as models/disease_model.pkl")
