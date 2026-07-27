export const mockPatients = [
  {
    id: "pat-101",
    mrn: "MRN-884192",
    firstName: "Eleanor",
    lastName: "Vance",
    gender: "Female",
    age: 38,
    dob: "1988-03-14",
    phone: "+1 (555) 234-5678",
    email: "eleanor.vance@example.com",
    address: "742 Evergreen Terrace, Springfield",
    bloodGroup: "O+",
    heightCm: 168,
    weightKg: 64,
    bmi: 22.7,
    status: "Active",
    primaryDoctor: "Dr. Sarah Jenkins, MD",
    department: "Cardiology",
    allergies: ["Penicillin", "Peanuts"],
    chronicConditions: ["Hypertension", "Mild Asthma"],
    emergencyContact: {
      name: "Arthur Vance",
      relation: "Spouse",
      phone: "+1 (555) 987-6543"
    },
    vitals: {
      bloodPressure: "124/82 mmHg",
      heartRate: "72 bpm",
      oxygenSat: "98%",
      temperature: "36.8 °C",
      bloodGlucose: "95 mg/dL",
      lastUpdated: "2026-07-24"
    },
    insurance: {
      provider: "BlueCross Health",
      policyNumber: "BC-9948201",
      groupNumber: "GRP-4412"
    }
  },
  {
    id: "pat-102",
    mrn: "MRN-391054",
    firstName: "Marcus",
    lastName: "Thorne",
    gender: "Male",
    age: 54,
    dob: "1972-09-22",
    phone: "+1 (555) 876-5432",
    email: "m.thorne@example.com",
    address: "128 Beacon St, Boston, MA",
    bloodGroup: "A-",
    heightCm: 182,
    weightKg: 88,
    bmi: 26.6,
    status: "Inpatient",
    primaryDoctor: "Dr. Robert Chen, MD",
    department: "Endocrinology",
    allergies: ["Sulfa Drugs"],
    chronicConditions: ["Type 2 Diabetes", "Hyperlipidemia"],
    emergencyContact: {
      name: "Diana Thorne",
      relation: "Wife",
      phone: "+1 (555) 345-6789"
    },
    vitals: {
      bloodPressure: "138/88 mmHg",
      heartRate: "80 bpm",
      oxygenSat: "96%",
      temperature: "37.1 °C",
      bloodGlucose: "142 mg/dL",
      lastUpdated: "2026-07-26"
    },
    insurance: {
      provider: "Aetna Healthcare",
      policyNumber: "AE-7712903",
      groupNumber: "GRP-8819"
    }
  },
  {
    id: "pat-103",
    mrn: "MRN-720193",
    firstName: "Sophia",
    lastName: "Rodriguez",
    gender: "Female",
    age: 29,
    dob: "1997-11-05",
    phone: "+1 (555) 432-1098",
    email: "sophia.rodriguez@example.com",
    address: "450 Ocean Drive, Miami, FL",
    bloodGroup: "B+",
    heightCm: 162,
    weightKg: 58,
    bmi: 22.1,
    status: "Active",
    primaryDoctor: "Dr. Emily Taylor, MD",
    department: "Neurology",
    allergies: ["Latex"],
    chronicConditions: ["Migraine with Aura"],
    emergencyContact: {
      name: "Carlos Rodriguez",
      relation: "Brother",
      phone: "+1 (555) 654-3210"
    },
    vitals: {
      bloodPressure: "118/76 mmHg",
      heartRate: "68 bpm",
      oxygenSat: "99%",
      temperature: "36.6 °C",
      bloodGlucose: "88 mg/dL",
      lastUpdated: "2026-07-20"
    },
    insurance: {
      provider: "UnitedHealth",
      policyNumber: "UH-1094827",
      groupNumber: "GRP-3310"
    }
  },
  {
    id: "pat-104",
    mrn: "MRN-559201",
    firstName: "David",
    lastName: "Kim",
    gender: "Male",
    age: 67,
    dob: "1959-04-18",
    phone: "+1 (555) 321-9876",
    email: "david.kim@example.com",
    address: "88 Pine St, Seattle, WA",
    bloodGroup: "AB+",
    heightCm: 175,
    weightKg: 79,
    bmi: 25.8,
    status: "Critical",
    primaryDoctor: "Dr. Sarah Jenkins, MD",
    department: "Cardiology",
    allergies: ["Aspirin", "Iodine Contrast"],
    chronicConditions: ["Coronary Artery Disease", "Heart Failure"],
    emergencyContact: {
      name: "Grace Kim",
      relation: "Daughter",
      phone: "+1 (555) 210-9876"
    },
    vitals: {
      bloodPressure: "148/92 mmHg",
      heartRate: "94 bpm",
      oxygenSat: "93%",
      temperature: "37.4 °C",
      bloodGlucose: "130 mg/dL",
      lastUpdated: "2026-07-26"
    },
    insurance: {
      provider: "Medicare Choice",
      policyNumber: "MC-8837190",
      groupNumber: "GRP-1002"
    }
  },
  {
    id: "pat-105",
    mrn: "MRN-194022",
    firstName: "Amara",
    lastName: "Okafor",
    gender: "Female",
    age: 42,
    dob: "1984-08-30",
    phone: "+1 (555) 789-0123",
    email: "amara.o@example.com",
    address: "312 Sunset Blvd, Los Angeles, CA",
    bloodGroup: "O-",
    heightCm: 170,
    weightKg: 66,
    bmi: 22.8,
    status: "Active",
    primaryDoctor: "Dr. Robert Chen, MD",
    department: "General Practice",
    allergies: ["Codeine"],
    chronicConditions: ["Hypothyroidism"],
    emergencyContact: {
      name: "Chidi Okafor",
      relation: "Brother",
      phone: "+1 (555) 890-1234"
    },
    vitals: {
      bloodPressure: "120/78 mmHg",
      heartRate: "70 bpm",
      oxygenSat: "98%",
      temperature: "36.7 °C",
      bloodGlucose: "91 mg/dL",
      lastUpdated: "2026-07-18"
    },
    insurance: {
      provider: "Cigna Health",
      policyNumber: "CG-5582910",
      groupNumber: "GRP-5541"
    }
  }
];

export const mockConsultations = {
  "pat-101": [
    {
      id: "c-1001",
      date: "2026-07-24",
      time: "10:30 AM",
      doctor: "Dr. Sarah Jenkins, MD",
      department: "Cardiology",
      chiefComplaint: "Routine follow-up for blood pressure monitoring and mild shortness of breath during exertion.",
      diagnosis: "Essential Hypertension (ICD-10: I10) - Stable",
      clinicalNotes: "Patient reports compliance with Lisinopril 10mg daily. BP today is 124/82 mmHg. EKG shows normal sinus rhythm. Advised continued aerobic exercise 30 mins 4x week and salt restriction.",
      prescriptions: [
        { name: "Lisinopril", dosage: "10 mg", frequency: "Once daily in the morning", duration: "90 days" },
        { name: "Albuterol Inhaler", dosage: "90 mcg/actuation", frequency: "2 puffs as needed for wheezing", duration: "30 days" }
      ],
      vitalsAtVisit: "BP: 124/82 mmHg | HR: 72 bpm | SpO2: 98%"
    },
    {
      id: "c-1002",
      date: "2026-04-12",
      time: "02:15 PM",
      doctor: "Dr. Sarah Jenkins, MD",
      department: "Cardiology",
      chiefComplaint: "Occasional dizziness when standing up rapidly.",
      diagnosis: "Mild Orthostatic Hypotension (ICD-10: I95.1)",
      clinicalNotes: "Basic metabolic panel normal. Hydration encouraged. Adjusted Lisinopril timing to evening.",
      prescriptions: [
        { name: "Lisinopril", dosage: "10 mg", frequency: "Once daily at bedtime", duration: "90 days" }
      ],
      vitalsAtVisit: "BP: 118/74 mmHg | HR: 68 bpm | SpO2: 99%"
    }
  ],
  "pat-102": [
    {
      id: "c-2001",
      date: "2026-07-26",
      time: "08:45 AM",
      doctor: "Dr. Robert Chen, MD",
      department: "Endocrinology",
      chiefComplaint: "Elevated fasting blood glucose levels over the past 2 weeks (140-160 mg/dL range).",
      diagnosis: "Type 2 Diabetes Mellitus with Uncontrolled Glycemia (ICD-10: E11.69)",
      clinicalNotes: "HbA1c measured at 7.8%. Discussed dietary adjustments and increasing Metformin dosage to 1000mg twice daily. Continuous Glucose Monitor (CGM) sensor ordered.",
      prescriptions: [
        { name: "Metformin ER", dosage: "1000 mg", frequency: "Twice daily with meals", duration: "90 days" },
        { name: "Atorvastatin", dosage: "20 mg", frequency: "Once daily at bedtime", duration: "90 days" }
      ],
      vitalsAtVisit: "BP: 138/88 mmHg | HR: 80 bpm | Glucose: 142 mg/dL"
    }
  ],
  "pat-103": [
    {
      id: "c-3001",
      date: "2026-07-20",
      time: "11:00 AM",
      doctor: "Dr. Emily Taylor, MD",
      department: "Neurology",
      chiefComplaint: "Throbbing right-sided headache preceded by visual scintillating scotoma lasting 20 minutes.",
      diagnosis: "Migraine with Aura (ICD-10: G43.109)",
      clinicalNotes: "Neurological exam completely intact without focal deficits. Sumatriptan prescribed for acute abortive therapy.",
      prescriptions: [
        { name: "Sumatriptan", dosage: "50 mg", frequency: "Take 1 tablet at onset of headache, max 200mg/day", duration: "As needed" }
      ],
      vitalsAtVisit: "BP: 118/76 mmHg | HR: 68 bpm | SpO2: 99%"
    }
  ],
  "pat-104": [
    {
      id: "c-4001",
      date: "2026-07-26",
      time: "07:30 AM",
      doctor: "Dr. Sarah Jenkins, MD",
      department: "Cardiology",
      chiefComplaint: "Acute exacerbation of dyspnea and bilateral lower extremity edema +2.",
      diagnosis: "Acute Decompensated Heart Failure (ICD-10: I50.9)",
      clinicalNotes: "Admitted to Cardiac Telemetry. IV Furosemide initiated. Continuous pulse oximetry monitoring. Chest X-ray indicates moderate pulmonary congestion.",
      prescriptions: [
        { name: "Furosemide IV", dosage: "40 mg", frequency: "Twice daily IV push", duration: "Inpatient stay" },
        { name: "Carvedilol", dosage: "6.25 mg", frequency: "Twice daily with food", duration: "Ongoing" }
      ],
      vitalsAtVisit: "BP: 148/92 mmHg | HR: 94 bpm | SpO2: 93%"
    }
  ],
  "pat-105": [
    {
      id: "c-5001",
      date: "2026-07-18",
      time: "03:30 PM",
      doctor: "Dr. Robert Chen, MD",
      department: "General Practice",
      chiefComplaint: "Annual wellness exam and refill for Levothyroxine.",
      diagnosis: "Primary Hypothyroidism (ICD-10: E03.9)",
      clinicalNotes: "Patient feeling energetic. TSH level is 1.8 mIU/L (within normal target). Re-ordered Levothyroxine 88mcg daily.",
      prescriptions: [
        { name: "Levothyroxine", dosage: "88 mcg", frequency: "Once daily on empty stomach 30m before breakfast", duration: "90 days" }
      ],
      vitalsAtVisit: "BP: 120/78 mmHg | HR: 70 bpm | SpO2: 98%"
    }
  ]
};

export const mockAppointments = [
  {
    id: "apt-901",
    patientId: "pat-101",
    patientName: "Eleanor Vance",
    mrn: "MRN-884192",
    date: "2026-07-27",
    time: "09:30 AM",
    doctor: "Dr. Sarah Jenkins, MD",
    department: "Cardiology",
    reason: "Echocardiogram & BP Follow-up",
    type: "Follow-up",
    status: "Scheduled"
  },
  {
    id: "apt-902",
    patientId: "pat-102",
    patientName: "Marcus Thorne",
    mrn: "MRN-391054",
    date: "2026-07-27",
    time: "11:00 AM",
    doctor: "Dr. Robert Chen, MD",
    department: "Endocrinology",
    reason: "CGM Sensor Placement & Diabetes Consultation",
    type: "In-Person",
    status: "Scheduled"
  },
  {
    id: "apt-903",
    patientId: "pat-104",
    patientName: "David Kim",
    mrn: "MRN-559201",
    date: "2026-07-27",
    time: "02:00 PM",
    doctor: "Dr. Sarah Jenkins, MD",
    department: "Cardiology",
    reason: "Inpatient Rounds & Diuretic Evaluation",
    type: "Round",
    status: "In Progress"
  },
  {
    id: "apt-904",
    patientId: "pat-103",
    patientName: "Sophia Rodriguez",
    mrn: "MRN-720193",
    date: "2026-07-28",
    time: "10:15 AM",
    doctor: "Dr. Emily Taylor, MD",
    department: "Neurology",
    reason: "Migraine Response Review",
    type: "Telehealth",
    status: "Confirmed"
  },
  {
    id: "apt-905",
    patientId: "pat-105",
    patientName: "Amara Okafor",
    mrn: "MRN-194022",
    date: "2026-07-25",
    time: "03:00 PM",
    doctor: "Dr. Robert Chen, MD",
    department: "General Practice",
    reason: "Thyroid Panel Review",
    type: "Completed Visit",
    status: "Completed"
  }
];
