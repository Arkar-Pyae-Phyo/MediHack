import json
import os

def analyze_json_file(file_path, file_type):
    """Analyze the JSON file structure"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n{'='*80}")
        print(f"FILE: {file_type.upper()}")
        print(f"{'='*80}")
        print(f"Type: {type(data)}")
        print(f"Total records: {len(data) if isinstance(data, list) else 'N/A'}")
        
        if isinstance(data, list) and len(data) > 0:
            print(f"\nFirst record keys: {list(data[0].keys())}")
            print(f"\nSample records (first 3):")
            for i, record in enumerate(data[:3]):
                print(f"\n--- Record {i+1} ---")
                for key, value in record.items():
                    # Truncate long values
                    val_str = str(value)
                    if len(val_str) > 100:
                        val_str = val_str[:100] + "..."
                    print(f"{key}: {val_str}")
            
            # Look for patient IDs
            if len(data) > 0:
                first_record = data[0]
                patient_keys = [k for k in first_record.keys() if 'patient' in k.lower() or 'id' in k.lower() or 'an' in k.lower()]
                if patient_keys:
                    print(f"\nPossible patient ID fields: {patient_keys}")
                    # Check for patient IDs in first few records
                    for i in range(min(5, len(data))):
                        for key in patient_keys:
                            if key in data[i]:
                                print(f"  Record {i}: {key} = {data[i][key]}")
        
        return data
        
    except Exception as e:
        print(f"\n✗ Error analyzing {file_type}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# Analyze all files
files = {
    'doc': 'sample_data/doc.json',
    'drug': 'sample_data/drug.json',
    'lab': 'sample_data/lab.json',
    'nurse': 'sample_data/nurse.json',
    'xray': 'sample_data/xray.json'
}

results = {}
for file_type, file_path in files.items():
    data = analyze_json_file(file_path, file_type)
    if data:
        results[file_type] = data

print(f"\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")
print(f"Successfully analyzed {len(results)}/{len(files)} files")
