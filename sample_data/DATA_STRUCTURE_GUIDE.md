# Sample Data Structures - Clean JSON Files

## Overview

The original `.json` files contained corrupted Excel data. I've created new `*_clean.json` files with proper healthcare data structures that you can use for the delta summary feature.

## Patient IDs in Sample Data
- **an1**: Patient with respiratory infection (bronchitis/pneumonia)
- **an2**: Patient with cardiac issues (atrial fibrillation)
- **an3**: Patient with gastrointestinal issues (gastroenteritis)

---

## 1. Doctor Notes (`doc_clean.json`)

### Structure:
```typescript
{
  patientId: string;           // e.g., "an1", "an2", "an3"
  timestamp: string;           // ISO 8601 format
  doctorId: string;            // e.g., "DR001"
  doctorName: string;          // Full name with title
  specialty: string;           // e.g., "Internal Medicine", "Cardiology"
  chiefComplaint: string;      // Primary reason for visit
  diagnosis: string;           // Current diagnosis
  assessment: string;          // Doctor's detailed assessment
  plan: string;                // Treatment plan
  vitalSigns: {
    temperature: number;       // °F
    bloodPressure: string;     // "systolic/diastolic"
    heartRate: number;         // bpm
    respiratoryRate: number;   // breaths/min
    oxygenSaturation: number;  // %
  };
  notes: string;               // Additional clinical notes
}
```

### Sample Records:
- Patient an1 has 2 visits (2/14 initial, 2/15 follow-up)
- Patient an2 has 2 visits (2/14 initial AFib, 2/15 follow-up)
- Patient an3 has 1 visit (2/13 gastroenteritis)

### Delta Summary Usage:
Compare timestamps to show:
- Changed diagnosis
- Improved vital signs (temperature, heart rate, O2 saturation)
- Updated treatment plans

---

## 2. Medications/Drugs (`drug_clean.json`)

### Structure:
```typescript
{
  patientId: string;
  timestamp: string;
  orderId: string;             // e.g., "RX-2024-001"
  medicationName: string;      // Drug name
  dosage: string;              // e.g., "500mg", "25mg"
  route: string;               // "Oral", "IV", etc.
  frequency: string;           // e.g., "Once daily", "Twice daily"
  duration: string;            // "5 days", "Ongoing"
  quantity: number;            // Number of pills/doses
  prescribedBy: string;        // Doctor name
  indication: string;          // Why prescribed
  instructions: string;        // Patient instructions
  status: string;              // "Active", "Completed", "Discontinued"
  startDate: string;           // YYYY-MM-DD
  endDate: string | null;      // YYYY-MM-DD or null for ongoing
}
```

### Sample Records:
- Patient an1: Azithromycin (antibiotic), Guaifenesin (cough), Lisinopril (maintenance)
- Patient an2: Metoprolol (rate control), Apixaban (anticoagulation)
- Patient an3: Ondansetron (anti-nausea)

### Delta Summary Usage:
Show:
- New medications started
- Dose changes (an2: Metoprolol 25mg → 50mg)
- Medications completed
- Status changes

---

## 3. Lab Results (`lab_clean.json`)

### Structure:
```typescript
{
  patientId: string;
  timestamp: string;
  orderId: string;             // e.g., "LAB-2024-001"
  testName: string;            // e.g., "Complete Blood Count (CBC)"
  status: string;              // "Completed", "Pending", "In Progress"
  collectedBy: string;         // Nurse name
  orderedBy: string;           // Doctor name
  results: {
    [testComponent: string]: {
      value: number;
      unit: string;
      range: string;           // Normal reference range
      flag: string;            // "Normal", "High", "Low", "Critical"
    }
  } | null;
  interpretation: string;      // Clinical interpretation
}
```

### Sample Records:
- Patient an1: CBC (WBC high → normalized), BMP (normal)
- Patient an2: Cardiac enzymes, Coagulation panel, Thyroid tests
- Patient an3: Stool culture (pending)

### Delta Summary Usage:
Show:
- New lab results available
- Values that changed from abnormal to normal (an1: WBC 12.5 → 9.8)
- New abnormal findings
- Pending tests completed

---

## 4. Nurse Vitals & Tasks (`nurse_clean.json`)

### Structure:
```typescript
{
  patientId: string;
  timestamp: string;
  nurseId: string;             // e.g., "RN005"
  nurseName: string;           // Full name with credential
  shift: string;               // "Day", "Evening", "Night"
  taskType: string;            // "Vital Signs", "Medication Administration", etc.
  vitalSigns?: {               // Present for vital sign checks
    temperature: number;
    temperatureUnit: string;
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    pain: number;              // 0-10 scale
    painScale: string;
  };
  medication?: string;         // Present for med administration
  notes: string;               // Nursing notes
}
```

### Sample Records:
- Patient an1: Multiple vital sign checks showing improvement
- Patient an2: Vital signs with heart rate monitoring for AFib
- Patient an3: Vital signs + intake/output monitoring

### Delta Summary Usage:
Show:
- Vital sign trends (improving or worsening)
- Medications administered
- Nursing assessments and interventions
- Pain level changes

---

## 5. X-Ray/Imaging (`xray_clean.json`)

### Structure:
```typescript
{
  patientId: string;
  timestamp: string;
  orderId: string;             // e.g., "IMG-2024-001"
  examType: string;            // e.g., "Chest X-Ray (PA and Lateral)"
  indication: string;          // Reason for exam
  technique: string;           // Technical details
  radiologistId: string;       // e.g., "RAD002"
  radiologistName: string;     // Full name with credential
  status: string;              // "Final Report", "Preliminary", "Pending"
  findings: {                  // Structured findings
    summary: string;
    [bodyPart: string]: string;
  };
  impression: string;          // Radiologist's conclusion
  recommendations: string;     // Follow-up recommendations
  imagingUrl: string;          // Path to DICOM image
}
```

### Sample Records:
- Patient an1: Initial chest X-ray (pneumonia) + follow-up (improving)
- Patient an2: Chest X-ray (cardiomegaly)
- Patient an3: Abdominal X-ray (normal)

### Delta Summary Usage:
Show:
- New imaging reports available
- Comparison between serial studies
- Resolution or progression of findings

---

## Implementation Example for Delta Summary

```typescript
// Example: Compare patient data between two time points

interface DeltaSummary {
  patientId: string;
  timeRange: {
    from: string;
    to: string;
  };
  changes: {
    diagnosis?: {
      previous: string;
      current: string;
    };
    vitalSigns?: {
      improved: string[];
      worsened: string[];
    };
    medications?: {
      started: string[];
      discontinued: string[];
      doseChanged: string[];
    };
    labResults?: {
      new: string[];
      improved: string[];
      worsened: string[];
    };
    imaging?: {
      new: string[];
      comparison: string;
    };
  };
}

// Usage in PatientDetailScreen:
function generateDeltaSummary(patientId: string, startDate: Date, endDate: Date): DeltaSummary {
  // 1. Load all *_clean.json files
  // 2. Filter by patientId and timestamp range
  // 3. Compare values to generate delta
  // 4. Return structured summary
}
```

---

## File Locations

All clean files are in: `sample_data/`
- `doc_clean.json` - Doctor notes
- `drug_clean.json` - Medications
- `lab_clean.json` - Lab results
- `nurse_clean.json` - Nurse vitals & tasks
- `xray_clean.json` - Imaging reports

## Next Steps

1. Import these files in your app instead of the corrupted `.json` files
2. Create TypeScript interfaces matching these structures
3. Implement the delta comparison logic in PatientDetailScreen
4. Use the patient IDs (an1, an2, an3) for testing
5. Build UI components to display the changes in a timeline format
