import json
from datetime import datetime

# Load all data files
with open('sample_data/doc_clean.json', 'r') as f:
    doctor_notes = json.load(f)
with open('sample_data/drug_clean.json', 'r') as f:
    medications = json.load(f)
with open('sample_data/lab_clean.json', 'r') as f:
    lab_results = json.load(f)
with open('sample_data/nurse_clean.json', 'r') as f:
    nurse_vitals = json.load(f)
with open('sample_data/xray_clean.json', 'r') as f:
    imaging = json.load(f)

def generate_delta_summary(patient_id, start_date, end_date):
    """Generate a delta summary for a patient between two dates"""
    
    print(f"\n{'='*80}")
    print(f"DELTA SUMMARY FOR PATIENT: {patient_id}")
    print(f"Period: {start_date} to {end_date}")
    print(f"{'='*80}\n")
    
    # Filter data for this patient and date range
    patient_docs = [d for d in doctor_notes if d['patientId'] == patient_id 
                    and start_date <= d['timestamp'][:10] <= end_date]
    patient_meds = [m for m in medications if m['patientId'] == patient_id 
                    and start_date <= m['timestamp'][:10] <= end_date]
    patient_labs = [l for l in lab_results if l['patientId'] == patient_id 
                    and start_date <= l['timestamp'][:10] <= end_date]
    patient_vitals = [v for v in nurse_vitals if v['patientId'] == patient_id 
                      and start_date <= v['timestamp'][:10] <= end_date]
    patient_imaging = [i for i in imaging if i['patientId'] == patient_id 
                       and start_date <= i['timestamp'][:10] <= end_date]
    
    # Sort by timestamp
    patient_docs.sort(key=lambda x: x['timestamp'])
    patient_vitals.sort(key=lambda x: x['timestamp'])
    
    # === DIAGNOSIS CHANGES ===
    if len(patient_docs) >= 2:
        print("🔍 DIAGNOSIS PROGRESSION:")
        for i, doc in enumerate(patient_docs, 1):
            print(f"   {i}. {doc['timestamp'][:10]} - {doc['diagnosis']}")
            if i > 1:
                print(f"      Change: {patient_docs[i-2]['diagnosis']} → {doc['diagnosis']}")
        print()
    
    # === VITAL SIGNS TRENDS ===
    vitals_with_signs = [v for v in patient_vitals if 'vitalSigns' in v]
    if len(vitals_with_signs) >= 2:
        first_vitals = vitals_with_signs[0]['vitalSigns']
        last_vitals = vitals_with_signs[-1]['vitalSigns']
        
        print("📊 VITAL SIGNS TREND:")
        print(f"   Temperature: {first_vitals['temperature']}°F → {last_vitals['temperature']}°F "
              f"({'↓ Improved' if last_vitals['temperature'] < first_vitals['temperature'] else '→ Stable'})")
        print(f"   Heart Rate: {first_vitals['heartRate']} bpm → {last_vitals['heartRate']} bpm "
              f"({'↓ Improved' if last_vitals['heartRate'] < first_vitals['heartRate'] else '↑ Increased'})")
        print(f"   O2 Saturation: {first_vitals['oxygenSaturation']}% → {last_vitals['oxygenSaturation']}% "
              f"({'↑ Improved' if last_vitals['oxygenSaturation'] > first_vitals['oxygenSaturation'] else '→ Stable'})")
        print(f"   Pain Level: {first_vitals['pain']}/10 → {last_vitals['pain']}/10 "
              f"({'↓ Improved' if last_vitals['pain'] < first_vitals['pain'] else '→ Stable'})")
        print()
    
    # === MEDICATIONS ===
    if patient_meds:
        print("💊 MEDICATIONS:")
        for med in patient_meds:
            status_icon = "✅" if med['status'] == "Active" else "⏸️"
            print(f"   {status_icon} {med['medicationName']} {med['dosage']} - {med['frequency']}")
            if "Dose" in med['status']:
                print(f"      ⚠️ Status: {med['status']}")
        print()
    
    # === LAB RESULTS ===
    completed_labs = [l for l in patient_labs if l['status'] == 'Completed']
    if completed_labs:
        print("🔬 LAB RESULTS:")
        for lab in completed_labs:
            print(f"   • {lab['testName']} ({lab['timestamp'][:10]})")
            if lab['results']:
                abnormal = [k for k, v in lab['results'].items() if v['flag'] not in ['Normal', '']]
                if abnormal:
                    print(f"     ⚠️ Abnormal: {', '.join(abnormal)}")
                else:
                    print(f"     ✓ All values normal")
            print(f"     Interpretation: {lab['interpretation']}")
        print()
    
    # === IMAGING ===
    if patient_imaging:
        print("🏥 IMAGING STUDIES:")
        for img in patient_imaging:
            print(f"   • {img['examType']} ({img['timestamp'][:10]})")
            print(f"     Impression: {img['impression']}")
        print()
    
    # === SUMMARY ===
    print("📈 OVERALL SUMMARY:")
    
    # Check if condition is improving
    improving_indicators = 0
    total_indicators = 0
    
    if len(vitals_with_signs) >= 2:
        first_vitals = vitals_with_signs[0]['vitalSigns']
        last_vitals = vitals_with_signs[-1]['vitalSigns']
        
        if last_vitals['temperature'] <= 98.8 and first_vitals['temperature'] > 99:
            improving_indicators += 1
            print("   ✓ Temperature normalized")
        total_indicators += 1
        
        if last_vitals['oxygenSaturation'] >= 97 and first_vitals['oxygenSaturation'] < 97:
            improving_indicators += 1
            print("   ✓ Oxygen saturation improved")
        total_indicators += 1
        
        if last_vitals['pain'] <= 2 and first_vitals['pain'] > 2:
            improving_indicators += 1
            print("   ✓ Pain decreased")
        total_indicators += 1
    
    if improving_indicators > total_indicators / 2:
        print(f"\n   🎉 Patient showing significant improvement!")
    elif improving_indicators > 0:
        print(f"\n   📊 Patient showing some improvement")
    else:
        print(f"\n   ⚠️ Patient condition stable or monitoring needed")
    
    print(f"\n{'='*80}\n")


# Generate delta summaries for all patients
generate_delta_summary('an1', '2026-02-14', '2026-02-15')
generate_delta_summary('an2', '2026-02-14', '2026-02-15')
generate_delta_summary('an3', '2026-02-13', '2026-02-13')
