import pandas as pd
import json
import os

# Define the file paths
sample_data_path = 'sample_data'
files = {
    'doc': os.path.join(sample_data_path, 'doc.json'),
    'drug': os.path.join(sample_data_path, 'drug.json'),
    'lab': os.path.join(sample_data_path, 'lab.json'),
    'nurse': os.path.join(sample_data_path, 'nurse.json'),
    'xray': os.path.join(sample_data_path, 'xray.json')
}

def extract_excel_data(file_path, file_type):
    """Extract data from an Excel file disguised as JSON"""
    try:
        # Read the Excel file
        df = pd.read_excel(file_path, engine='openpyxl')
        
        print(f"\n{'='*80}")
        print(f"FILE: {file_type.upper()}")
        print(f"{'='*80}")
        print(f"Total rows: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        print(f"\nFirst 5 records:")
        print(df.head(5).to_string(index=False))
        
        # Look for patient IDs
        patient_id_cols = [col for col in df.columns if 'patient' in col.lower() or 'id' in col.lower()]
        if patient_id_cols:
            print(f"\nPatient ID column(s): {patient_id_cols}")
            unique_patients = df[patient_id_cols[0]].unique()[:10]
            print(f"Sample patient IDs: {list(unique_patients)}")
        
        # Convert to JSON format for easier use
        json_data = df.to_dict('records')
        
        # Save cleaned JSON
        output_file = file_path.replace('.json', '_clean.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, default=str)
        
        print(f"\n✓ Saved clean JSON to: {output_file}")
        
        return df, json_data
        
    except Exception as e:
        print(f"\n✗ Error processing {file_type}: {str(e)}")
        return None, None

# Extract all files
results = {}
for file_type, file_path in files.items():
    df, json_data = extract_excel_data(file_path, file_type)
    if df is not None:
        results[file_type] = {
            'dataframe': df,
            'json': json_data
        }

print(f"\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")
print(f"Successfully processed {len(results)}/{len(files)} files")
print("\nTo use this data in your app:")
print("1. Import the *_clean.json files instead of the original .json files")
print("2. The data is now in proper JSON array format")
print("3. Each record is a dictionary with field names as keys")
