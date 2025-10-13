import pandas as pd
import os

# --- Configuration ---
# 1. Define the input/output paths based on your structure
INPUT_FILE = 'data/diseases.csv'
OUTPUT_FILE = 'data/diseases_cleaned.csv'
DISEASE_TO_REMOVE = 'Heart failure' # Ensure this exactly matches the entry in your CSV

# 2. Define the name of the column that contains the disease label
# You may need to inspect your CSV file to confirm the exact column name.
DISEASE_COLUMN_NAME = 'Disease' 

def remove_disease_from_dataset(input_path, output_path, disease_name, disease_col):
    """
    Loads the original dataset, filters out a specified disease, and saves the cleaned data.
    """
    if not os.path.exists(input_path):
        print(f"Error: Input file not found at '{input_path}'.")
        return

    try:
        # Load the dataset
        df = pd.read_csv(input_path)
        print(f"Original dataset shape: {df.shape}")

        # Check if the disease column exists
        if disease_col not in df.columns:
            print(f"Error: Disease column '{disease_col}' not found in the dataset.")
            return

        # Filter out the specified disease
        # Keeps all rows where the value in the DISEASE_COLUMN_NAME is NOT equal to the DISEASE_TO_REMOVE
        df_cleaned = df[df[disease_col] != disease_name]

        print(f"Cleaned dataset shape: {df_cleaned.shape}")
        
        # Verify the removal
        removed_count = df.shape[0] - df_cleaned.shape[0]
        print(f"Successfully removed {removed_count} rows corresponding to '{disease_name}'.")

        # Save the filtered data to a new CSV file
        df_cleaned.to_csv(output_path, index=False)
        print(f"\nCleaned data saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred during processing: {e}")

if __name__ == "__main__":
    remove_disease_from_dataset(INPUT_FILE, OUTPUT_FILE, DISEASE_TO_REMOVE, DISEASE_COLUMN_NAME)
