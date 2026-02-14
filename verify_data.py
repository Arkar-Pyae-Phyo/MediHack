import json
import os

files = {
    'Doctor Notes': 'doc_clean.json',
    'Medications': 'drug_clean.json',
    'Lab Results': 'lab_clean.json',
    'Nurse Vitals': 'nurse_clean.json',
    'X-Ray/Imaging': 'xray_clean.json'
}

base_path = 'sample_data'

print('\n' + '='*80)
print('SAMPLE DATA SUMMARY')
print('='*80 + '\n')

for name, filename in files.items():
    filepath = os.path.join(base_path, filename)
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    patient_ids = sorted(set(r['patientId'] for r in data))
    dates = [r['timestamp'][:10] for r in data]
    
    print(f'📋 {name} ({filename})')
    print(f'   ├─ Total records: {len(data)}')
    print(f'   ├─ Patient IDs: {", ".join(patient_ids)}')
    print(f'   ├─ Date range: {min(dates)} to {max(dates)}')
    print(f'   └─ Sample fields: {", ".join(list(data[0].keys())[:5])}...')
    print()

print('='*80)
print('DATA READY FOR USE!')
print('='*80)
print('\nTo use in your app:')
print('1. Import: const doctorNotes = require("./sample_data/doc_clean.json");')
print('2. Filter by patientId: doctorNotes.filter(n => n.patientId === "an1")')
print('3. Sort by timestamp to create timeline')
print('4. Compare records to generate delta summary')
print('\nSee DATA_STRUCTURE_GUIDE.md for complete documentation.')
