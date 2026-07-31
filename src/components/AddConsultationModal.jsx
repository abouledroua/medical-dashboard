import React, { useState, useEffect } from 'react';
import {
  Pill,
  FileCheck,
  TestTube,
  Compass,
  CalendarOff,
  FileText,
  Stethoscope,
  User,
  AlertTriangle,
  Activity,
  Heart,
  Clock,
  Plus,
  Trash2,
  Save,
  Printer,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Building2,
  Phone,
  MapPin,
  BadgeInfo,
  Calendar,
  Layers,
  Check,
  FileCheck2
} from 'lucide-react';
import { translations } from '../translations';
import PatientOverviewPanel from './PatientOverviewPanel';

export default function AddConsultationModal({ draft, patient, patients = [], onSelectPatient, onConsultationAdded, onCancel, onUpdateDraft, onClose, onEditPatient, lang = 'fr', clinicInfo }) {
  const t = translations[lang] || translations.fr;
  const activePatient = patient || draft?.patient || (patients && patients.length > 0 ? patients[0] : null);

  // Active Dynamic Document Tab Selection:
  // 'ordonnance' | 'certificat' | 'bilan' | 'orientation' | 'arret_travail' | 'doc_medical'
  const [activeDocType, setActiveDocType] = useState(draft?.activeDocType || 'ordonnance');

  // 1. ORDONNANCE (Prescriptions) State
  const [prescriptions, setPrescriptions] = useState(
    draft?.prescriptions && draft.prescriptions.length > 0
      ? draft.prescriptions
      : [
          { name: 'Amoxicilline 1g', dosage: '1 gélule', frequency: '2 fois / jour', duration: '7 jours', instructions: 'Après les repas' },
          { name: 'Paracétamol 1g', dosage: '1 comprimé', frequency: '3 fois / jour si besoin', duration: '5 jours', instructions: 'En cas de douleur ou fièvre' }
        ]
  );

  // 2. CERTIFICAT MÉDICAL State
  const [certificat, setCertificat] = useState(
    draft?.certificat || {
      type: 'Certificat Médical Descriptif',
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 3,
      content: `Je soussigné, ${clinicInfo?.doctorNameFr || 'Dr. A. BENKERMI Ep. TATI'}, certifie avoir examiné ce jour le patient susnommé et avoir constaté des signes cliniques nécessitant un repos et un traitement médical approprié.`,
      fitness: 'apte'
    }
  );

  // 3. BILAN (Lab Work & Radiology Requests) State
  const [bilan, setBilan] = useState(
    draft?.bilan || {
      bioExams: ['NFS / Plaquettes', 'VS / CRP'],
      imgExams: ['Radiographie du Thorax'],
      customExam: '',
      clinicalIndication: 'Bilan de contrôle ORL et recherche de syndrome inflammatoire.'
    }
  );

  // 4. ORIENTATION (Referral Letter) State
  const [orientation, setOrientation] = useState(
    draft?.orientation || {
      specialist: 'Cardiologie',
      clinic: 'CHU / Clinique Spécialisée',
      reason: 'Avis spécialisé pour bilan complémentaire et prise en charge.',
      clinicalNotes: 'Patient adressé pour exploration clinique approfondie.'
    }
  );

  // 5. ARRÊT DE TRAVAIL (Sick Leave) State
  const [arretTravail, setArretTravail] = useState(
    draft?.arretTravail || {
      days: 3,
      startDate: new Date().toISOString().split('T')[0],
      reason: 'Maladie - Repos médical strict à domicile',
      allowedOutings: true,
      outingHours: '10h-12h et 15h-17h'
    }
  );

  // 6. DOCUMENT MÉDICAL (Clinical Report & Observations) State
  const [docMedical, setDocMedical] = useState(
    draft?.docMedical || {
      title: 'Compte Rendu d\'Examen Clinique ORL',
      otoscopie: 'Tympan droit normal, tympan gauche congestif sans perforation.',
      rhinoscopie: 'Fosses nasales libres, muqueuse légèrement hyperémiée.',
      laryngoscopie: 'Cavité buccale propre, pharynx normal, amygdales non hypertrophiées.',
      conclusion: 'Syndrome catarrhal aigu. Traitement médical instauré.',
      customNotes: ''
    }
  );

  // 7. PROCHAIN RENDEZ-VOUS (Follow-up Appointment) State
  const [nextAppointment, setNextAppointment] = useState(
    draft?.nextAppointment || {
      date: '',
      time: '09:00',
      reason: lang === 'fr' ? 'Consultation de contrôle ORL' : 'Follow-up ORL evaluation',
      notes: ''
    }
  );
  const [isBookingAppt, setIsBookingAppt] = useState(false);
  const [apptBookingStatus, setApptBookingStatus] = useState('');

  const [doctor, setDoctor] = useState(draft?.doctor || clinicInfo?.doctorNameFr || 'Dr. A. BENKERMI Ep. TATI');
  const [department, setDepartment] = useState(draft?.department || activePatient?.department || 'ORL');

  useEffect(() => {
    if (clinicInfo?.doctorNameFr) {
      if (!draft?.doctor || doctor === 'Dr. A. BENKERMI Ep. TATI') {
        setDoctor(clinicInfo.doctorNameFr);
      }
      setCertificat(prev => {
        if (prev.content && prev.content.includes('Dr. A. BENKERMI Ep. TATI')) {
          return { ...prev, content: prev.content.replace('Dr. A. BENKERMI Ep. TATI', clinicInfo.doctorNameFr) };
        }
        return prev;
      });
    }
  }, [clinicInfo]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState('');
  const [fullPatientDetails, setFullPatientDetails] = useState(activePatient);

  // Fetch full patient details (vitals, consultations, allergies, antecedents) if only basic object was provided
  useEffect(() => {
    setFullPatientDetails(activePatient);
    const patId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!patId) return;

    let isMounted = true;
    fetch(`/api/patients/${encodeURIComponent(patId)}`)
      .then(res => {
        if (!res.ok) throw new Error('Patient details fetch failed');
        return res.json();
      })
      .then(data => {
        if (isMounted && data && !data.error) {
          setFullPatientDetails(prev => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [activePatient?.id, activePatient?.codeBarre, activePatient?.mrn]);

  // Sync state whenever active patient or draft changes
  useEffect(() => {
    if (draft) {
      if (draft.activeDocType) setActiveDocType(draft.activeDocType);
      if (draft.prescriptions) setPrescriptions(draft.prescriptions);
      if (draft.certificat) setCertificat(draft.certificat);
      if (draft.bilan) setBilan(draft.bilan);
      if (draft.orientation) setOrientation(draft.orientation);
      if (draft.arretTravail) setArretTravail(draft.arretTravail);
      if (draft.docMedical) setDocMedical(draft.docMedical);
      if (draft.nextAppointment) setNextAppointment(draft.nextAppointment);
      if (draft.doctor) setDoctor(draft.doctor);
      if (draft.department) setDepartment(draft.department);
    }
  }, [draft?.patientId, activePatient?.id, activePatient?.codeBarre]);

  // Notify parent of draft updates so state is preserved across patient switches and F5 refreshes
  const notifyDraftUpdate = (updatedFields = {}) => {
    if (onUpdateDraft && activePatient) {
      onUpdateDraft({
        patientId: activePatient.id || activePatient.codeBarre,
        patient: activePatient,
        activeDocType: updatedFields.activeDocType || activeDocType,
        prescriptions: updatedFields.prescriptions || prescriptions,
        certificat: updatedFields.certificat || certificat,
        bilan: updatedFields.bilan || bilan,
        orientation: updatedFields.orientation || orientation,
        arretTravail: updatedFields.arretTravail || arretTravail,
        docMedical: updatedFields.docMedical || docMedical,
        nextAppointment: updatedFields.nextAppointment || nextAppointment,
        doctor: updatedFields.doctor || doctor,
        department: updatedFields.department || department
      });
    }
  };

  const handleBookNextApptNow = async () => {
    if (!nextAppointment.date || !activePatient) return;
    setIsBookingAppt(true);
    setApptBookingStatus('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activePatient.id || activePatient.codeBarre,
          patientName: `${activePatient.firstName || activePatient.prenom || ''} ${activePatient.lastName || activePatient.nom || ''}`.trim(),
          mrn: activePatient.codeBarre || activePatient.mrn,
          date: nextAppointment.date,
          time: nextAppointment.time || '09:00 AM',
          reason: nextAppointment.reason || (lang === 'fr' ? 'Consultation de suivi' : 'Follow-up visit'),
          doctor,
          department,
          status: 'Scheduled',
          notes: nextAppointment.notes
        })
      });

      if (res.ok) {
        setApptBookingStatus(lang === 'fr' ? 'Rendez-vous programmé et enregistré dans l\'Agenda !' : 'Appointment booked in schedule!');
      }
    } catch (err) {
      console.error('Error booking next appt:', err);
    } finally {
      setIsBookingAppt(false);
    }
  };

  const handleCancel = () => {
    const pId = activePatient ? (activePatient.id || activePatient.codeBarre) : null;
    if (onCancel) onCancel(pId);
    else if (onClose) onClose();
  };

  // Preset Medication Items
  const quickMedications = [
    { name: 'Amoxicilline 1g', dosage: '1 gélule', frequency: '2 fois / jour', duration: '7 jours' },
    { name: 'Paracétamol 1g', dosage: '1 comprimé', frequency: '3 fois / jour', duration: '5 jours' },
    { name: 'Solupred 20mg', dosage: '3 comprimés (matin)', frequency: '1 fois / jour', duration: '5 jours' },
    { name: 'Oflocet Auriculaire', dosage: '5 gouttes', frequency: '2 fois / jour', duration: '7 jours' },
    { name: 'Rhinoflux Spray Nasal', dosage: '2 pulvérisations', frequency: '3 fois / jour', duration: '5 jours' },
    { name: 'Augmentin 1g', dosage: '1 sachet', frequency: '2 fois / jour', duration: '7 jours' }
  ];

  const handleAddRxRow = (preset = null) => {
    const item = preset || { name: '', dosage: '', frequency: '2 fois / jour', duration: '7 jours', instructions: '' };
    const newRx = [...prescriptions, item];
    setPrescriptions(newRx);
    notifyDraftUpdate({ prescriptions: newRx });
  };

  const handleRemoveRxRow = (index) => {
    const newRx = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(newRx);
    notifyDraftUpdate({ prescriptions: newRx });
  };

  const handleRxChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
    notifyDraftUpdate({ prescriptions: updated });
  };

  // Biology & Imaging Presets
  const bioOptions = [
    'NFS / Plaquettes',
    'VS / CRP',
    'Glycémie à jeun',
    'Bilan Rénal (Urée / Créatinine)',
    'Bilan Hépatique (ASAT / ALAT)',
    'Bilan de Coagulation (TP / TPK / INR)',
    'Prélèvement Bactériologique de Gorge'
  ];

  const imgOptions = [
    'Radiographie du Thorax (Face)',
    'Scanner du Massif Facial / Sinus',
    'Scanner des Rochers / Oreilles',
    'IRM Cérébrale et Angio-IRM',
    'Échographie Cervicale / Thyroïdienne',
    'Audiogramme Tonal et Tympanométrie'
  ];

  const toggleBioExam = (exam) => {
    const updatedBio = bilan.bioExams.includes(exam)
      ? bilan.bioExams.filter(e => e !== exam)
      : [...bilan.bioExams, exam];
    const newBilan = { ...bilan, bioExams: updatedBio };
    setBilan(newBilan);
    notifyDraftUpdate({ bilan: newBilan });
  };

  const toggleImgExam = (exam) => {
    const updatedImg = bilan.imgExams.includes(exam)
      ? bilan.imgExams.filter(e => e !== exam)
      : [...bilan.imgExams, exam];
    const newBilan = { ...bilan, imgExams: updatedImg };
    setBilan(newBilan);
    notifyDraftUpdate({ bilan: newBilan });
  };

  // Automatic Calculation of End Date & Reprise Date for Work Stop
  const calculateEndDate = (startDateStr, days) => {
    if (!startDateStr || !days) return '';
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + parseInt(days, 10) - 1);
    return date.toISOString().split('T')[0];
  };

  const calculateReturnDate = (startDateStr, days) => {
    if (!startDateStr || !days) return '';
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + parseInt(days, 10));
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activePatient) {
      setError(lang === 'fr' ? 'Veuillez sélectionner un patient.' : 'Please select a patient.');
      return;
    }

    setLoading(true);
    setError('');

    const validRx = prescriptions.filter(r => r.name.trim().length > 0);

    // Summary strings for legacy DB record compatibility
    const chiefComplaintSummary = docMedical.conclusion || docMedical.title || `Consultation ${activeDocType.toUpperCase()}`;
    const diagnosisSummary = docMedical.conclusion || `Examen & Document ${activeDocType}`;

    const structuredPayload = {
      activeDocType,
      prescriptions: validRx,
      certificat,
      bilan,
      orientation,
      arretTravail,
      docMedical,
      nextAppointment
    };

    try {
      const pId = activePatient.id || activePatient.codeBarre;

      if (nextAppointment.date) {
        try {
          await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: pId,
              patientName: `${activePatient.firstName || activePatient.prenom || ''} ${activePatient.lastName || activePatient.nom || ''}`.trim(),
              mrn: activePatient.codeBarre || activePatient.mrn,
              date: nextAppointment.date,
              time: nextAppointment.time || '09:00 AM',
              reason: nextAppointment.reason || (lang === 'fr' ? 'Consultation de suivi' : 'Follow-up visit'),
              doctor,
              department,
              status: 'Scheduled',
              notes: nextAppointment.notes
            })
          });
        } catch (errAppt) {
          console.error('Auto appt scheduling error:', errAppt);
        }
      }

      const res = await fetch(`/api/patients/${pId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint: chiefComplaintSummary,
          diagnosis: diagnosisSummary,
          clinicalNotes: JSON.stringify(structuredPayload),
          prescriptions: validRx,
          doctor,
          department,
          vitalsAtVisit: `BP: ${activePatient.vitals?.bloodPressure || '120/80'} | HR: ${activePatient.vitals?.heartRate || '72 bpm'}`
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'fr' ? 'Échec de la sauvegarde de la consultation.' : 'Failed to save consultation note.');
      }

      const newConsultation = await res.json();
      setSavedSuccessMessage(lang === 'fr' ? 'Consultation enregistrée avec succès !' : 'Consultation saved successfully!');
      setTimeout(() => {
        if (onConsultationAdded) onConsultationAdded(newConsultation, pId);
      }, 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const docTabs = [
    {
      id: 'ordonnance',
      label: lang === 'fr' ? 'Ordonnance' : 'Prescription',
      icon: Pill,
      color: 'from-emerald-500 to-teal-500',
      badge: `${prescriptions.filter(p => p.name.trim()).length} ${lang === 'fr' ? 'méd.' : 'meds'}`
    },
    {
      id: 'certificat',
      label: lang === 'fr' ? 'Certificat Médical' : 'Medical Certificate',
      icon: FileCheck,
      color: 'from-amber-500 to-orange-500',
      badge: lang === 'fr' ? 'Certif' : 'Cert.'
    },
    {
      id: 'bilan',
      label: lang === 'fr' ? 'Bilan' : 'Lab / Imaging',
      icon: TestTube,
      color: 'from-cyan-500 to-blue-500',
      badge: `${bilan.bioExams.length + bilan.imgExams.length} ${lang === 'fr' ? 'exam.' : 'tests'}`
    },
    {
      id: 'orientation',
      label: lang === 'fr' ? 'Orientation' : 'Referral Letter',
      icon: Compass,
      color: 'from-purple-500 to-indigo-500',
      badge: orientation.specialist
    },
    {
      id: 'arret_travail',
      label: lang === 'fr' ? 'Arrêt de Travail' : 'Sick Leave',
      icon: CalendarOff,
      color: 'from-rose-500 to-pink-500',
      badge: `${arretTravail.days}${lang === 'fr' ? 'j' : 'd'}`
    },
    {
      id: 'doc_medical',
      label: lang === 'fr' ? 'Document Médical' : 'Medical Document',
      icon: FileText,
      color: 'from-teal-500 to-emerald-600',
      badge: lang === 'fr' ? 'Rapport' : 'Report'
    },
    {
      id: 'prochain_rdv',
      label: lang === 'fr' ? 'Prochain Rendez-vous' : 'Next Appointment',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      badge: nextAppointment.date || (lang === 'fr' ? 'Suivi' : 'Follow-up')
    }
  ];

  return (
    <div className="w-full space-y-5 select-none">
      {/* Top Banner Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
            <Stethoscope className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {lang === 'fr' ? 'Espace Consultation Médicale' : 'Medical Consultation Suite'}
            </h2>
            <p className="text-xs text-slate-400">
              {clinicInfo?.nomCabinet || (lang === 'fr' ? 'Cabinet Médical' : 'Medical Clinic')} • {clinicInfo?.doctorNameFr || doctor}
            </p>
          </div>
        </div>

        {/* Global Save / Cancel Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
          >
            <Save className="w-4 h-4" />
            {loading ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer la Consultation' : 'Save Consultation')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Column (2 Panels) & Right Column (Dynamic Workspace) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Patient Overview */}
        <div className="lg:col-span-4 space-y-4">
          <PatientOverviewPanel patient={fullPatientDetails || activePatient} onEditPatient={onEditPatient} lang={lang} clinicInfo={clinicInfo} />
        </div>

        {/* RIGHT COLUMN: BIG DYNAMIC WORKSPACE PANEL BASED ON SELECTION */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Document Type Selector Tabs */}
          <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-1.5 bg-slate-950/80">
            {docTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeDocType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveDocType(tab.id);
                    notifyDraftUpdate({ activeDocType: tab.id });
                  }}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20 scale-[1.02]'
                      : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-teal-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC PANEL CONTENT AREA */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 min-h-[460px] bg-slate-900/90">

            {/* 1. DYNAMIC PANEL: ORDONNANCE (Prescription Builder) */}
            {activeDocType === 'ordonnance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-400" />
                      {lang === 'fr' ? 'Rédaction de l\'Ordonnance Médicale' : 'Prescription Builder'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Sélectionner les médicaments et la posologie' : 'Add medications and posology'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddRxRow()}
                    className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Ajouter Médicament' : 'Add Drug'}
                  </button>
                </div>

                {/* Fast Prescription Favorites */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {lang === 'fr' ? 'Favoris Rapides ORL :' : 'Quick Presets:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickMedications.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddRxRow(preset)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-teal-300 border border-slate-800 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                      >
                        <Plus className="w-3 h-3 text-teal-400" /> {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prescription List Rows */}
                <div className="space-y-3 pt-2">
                  {prescriptions.map((rx, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 relative group hover:border-slate-700 transition">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Médicament' : 'Medication'}
                          </label>
                          <input
                            type="text"
                            placeholder="ex: Amoxicilline 1g"
                            value={rx.name}
                            onChange={(e) => handleRxChange(i, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Dosage' : 'Dosage'}
                          </label>
                          <input
                            type="text"
                            placeholder="ex: 1 gélule"
                            value={rx.dosage}
                            onChange={(e) => handleRxChange(i, 'dosage', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Posologie / Fréquence' : 'Posology'}
                          </label>
                          <input
                            type="text"
                            placeholder="ex: 2 fois / jour"
                            value={rx.frequency}
                            onChange={(e) => handleRxChange(i, 'frequency', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div className="col-span-10 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Durée' : 'Duration'}
                          </label>
                          <input
                            type="text"
                            placeholder="ex: 7 jours"
                            value={rx.duration}
                            onChange={(e) => handleRxChange(i, 'duration', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 text-right pt-4">
                          {prescriptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRxRow(i)}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-900 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. DYNAMIC PANEL: CERTIFICAT MÉDICAL */}
            {activeDocType === 'certificat' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-400" />
                      {lang === 'fr' ? 'Édition du Certificat Médical' : 'Medical Certificate'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Générer un certificat d\'aptitude ou descriptif' : 'Generate descriptive or fitness certificate'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Type de Certificat' : 'Certificate Type'}
                    </label>
                    <select
                      value={certificat.type}
                      onChange={(e) => {
                        const newCert = { ...certificat, type: e.target.value };
                        setCertificat(newCert);
                        notifyDraftUpdate({ certificat: newCert });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    >
                      <option value="Certificat Médical Descriptif">Certificat Médical Descriptif</option>
                      <option value="Certificat de Bonne Santé & Aptitude">Certificat de Bonne Santé & Aptitude</option>
                      <option value="Certificat de Non-Contre-Indication Sportive">Certificat de Non-Contre-Indication Sportive</option>
                      <option value="Certificat de Présence & Consultation">Certificat de Présence & Consultation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Date du Certificat' : 'Date'}
                    </label>
                    <input
                      type="date"
                      value={certificat.startDate}
                      onChange={(e) => {
                        const newCert = { ...certificat, startDate: e.target.value };
                        setCertificat(newCert);
                        notifyDraftUpdate({ certificat: newCert });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Texte & Constatations Médicales' : 'Medical Certificate Text'}
                  </label>
                  <textarea
                    rows="6"
                    value={certificat.content}
                    onChange={(e) => {
                      const newCert = { ...certificat, content: e.target.value };
                      setCertificat(newCert);
                      notifyDraftUpdate({ certificat: newCert });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                  ></textarea>
                </div>
              </div>
            )}

            {/* 3. DYNAMIC PANEL: BILAN (Lab Work & Radiology Requests) */}
            {activeDocType === 'bilan' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-cyan-400" />
                      {lang === 'fr' ? 'Demande de Bilan Biologique & Imagerie' : 'Biological & Radiology Order'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Sélectionner les examens de laboratoire et radiologies demandés' : 'Select requested lab tests and radiology'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Biology Checkbox List */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <TestTube className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Analyses Biologiques' : 'Lab Tests'}
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {bioOptions.map((exam, i) => {
                        const checked = bilan.bioExams.includes(exam);
                        return (
                          <label key={i} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBioExam(exam)}
                              className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0"
                            />
                            <span className={checked ? 'text-teal-300 font-semibold' : ''}>{exam}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radiology Checkbox List */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Examens d\'Imagerie' : 'Radiology'}
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {imgOptions.map((exam, i) => {
                        const checked = bilan.imgExams.includes(exam);
                        return (
                          <label key={i} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleImgExam(exam)}
                              className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0"
                            />
                            <span className={checked ? 'text-blue-300 font-semibold' : ''}>{exam}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Renseignements Cliniques pour le Laboratoire / Radiologue' : 'Clinical Rationale'}
                  </label>
                  <input
                    type="text"
                    value={bilan.clinicalIndication}
                    onChange={(e) => {
                      const newBilan = { ...bilan, clinicalIndication: e.target.value };
                      setBilan(newBilan);
                      notifyDraftUpdate({ bilan: newBilan });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. DYNAMIC PANEL: ORIENTATION (Referral Letter) */}
            {activeDocType === 'orientation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-400" />
                      {lang === 'fr' ? 'Lettre d\'Orientation & Transfert Médical' : 'Specialist Referral Letter'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Adresser le patient vers un confrère ou service spécialisé' : 'Refer patient to a specialist colleague'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Spécialité Destinataire' : 'Destination Specialty'}
                    </label>
                    <select
                      value={orientation.specialist}
                      onChange={(e) => {
                        const newO = { ...orientation, specialist: e.target.value };
                        setOrientation(newO);
                        notifyDraftUpdate({ orientation: newO });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    >
                      <option value="Cardiologie">Cardiologie</option>
                      <option value="Neurologie">Neurologie</option>
                      <option value="Chirurgie Maxillo-Faciale">Chirurgie Maxillo-Faciale</option>
                      <option value="Pneumologie">Pneumologie</option>
                      <option value="Endocrinologie">Endocrinologie</option>
                      <option value="Pédiatrie">Pédiatrie</option>
                      <option value="Radiologie / Imagerie">Radiologie / Imagerie</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Établissement / Structure' : 'Hospital / Clinic'}
                    </label>
                    <input
                      type="text"
                      placeholder="ex: CHU Mustapha Pacha"
                      value={orientation.clinic}
                      onChange={(e) => {
                        const newO = { ...orientation, clinic: e.target.value };
                        setOrientation(newO);
                        notifyDraftUpdate({ orientation: newO });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Motif d\'Orientation & Synthèse Clinique' : 'Reason for Referral'}
                  </label>
                  <textarea
                    rows="5"
                    value={orientation.reason}
                    onChange={(e) => {
                      const newO = { ...orientation, reason: e.target.value };
                      setOrientation(newO);
                      notifyDraftUpdate({ orientation: newO });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                  ></textarea>
                </div>
              </div>
            )}

            {/* 5. DYNAMIC PANEL: ARRÊT DE TRAVAIL (Sick Leave) */}
            {activeDocType === 'arret_travail' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarOff className="w-4 h-4 text-rose-400" />
                      {lang === 'fr' ? 'Certificat d\'Arrêt de Travail' : 'Work Disability / Sick Leave'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Prescription de repos médical et arrêt de travail' : 'Prescribe sick leave days and return date'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Nombre de Jours' : 'Number of Days'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={arretTravail.days}
                      onChange={(e) => {
                        const newAT = { ...arretTravail, days: e.target.value };
                        setArretTravail(newAT);
                        notifyDraftUpdate({ arretTravail: newAT });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none font-bold text-teal-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Date de Début (Du)' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={arretTravail.startDate}
                      onChange={(e) => {
                        const newAT = { ...arretTravail, startDate: e.target.value };
                        setArretTravail(newAT);
                        notifyDraftUpdate({ arretTravail: newAT });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Date de Fin (Au inclus)' : 'End Date'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={calculateEndDate(arretTravail.startDate, arretTravail.days)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-900/60 text-teal-300 font-bold border border-slate-800 rounded-xl cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {lang === 'fr' ? 'Reprise du Travail prévue le :' : 'Expected Return to Work:'}
                  </span>
                  <span className="text-sm font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
                    {calculateReturnDate(arretTravail.startDate, arretTravail.days)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Motif Médical / Remarques' : 'Medical Justification'}
                  </label>
                  <input
                    type="text"
                    value={arretTravail.reason}
                    onChange={(e) => {
                      const newAT = { ...arretTravail, reason: e.target.value };
                      setArretTravail(newAT);
                      notifyDraftUpdate({ arretTravail: newAT });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 6. DYNAMIC PANEL: DOCUMENT MÉDICAL (Clinical Report & Observations) */}
            {activeDocType === 'doc_medical' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-400" />
                      {lang === 'fr' ? 'Compte Rendu d\'Examen Clinique ORL' : 'Clinical Examination & Report'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Observations détaillées des structures ORL et conclusion' : 'Detailed clinical observations'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Otoscopie' : 'Otoscopy'}
                    </label>
                    <textarea
                      rows="3"
                      value={docMedical.otoscopie}
                      onChange={(e) => {
                        const newDM = { ...docMedical, otoscopie: e.target.value };
                        setDocMedical(newDM);
                        notifyDraftUpdate({ docMedical: newDM });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Rhinoscopie' : 'Rhinoscopy'}
                    </label>
                    <textarea
                      rows="3"
                      value={docMedical.rhinoscopie}
                      onChange={(e) => {
                        const newDM = { ...docMedical, rhinoscopie: e.target.value };
                        setDocMedical(newDM);
                        notifyDraftUpdate({ docMedical: newDM });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Laryngoscopie / Pharynx' : 'Laryngoscopy'}
                    </label>
                    <textarea
                      rows="3"
                      value={docMedical.laryngoscopie}
                      onChange={(e) => {
                        const newDM = { ...docMedical, laryngoscopie: e.target.value };
                        setDocMedical(newDM);
                        notifyDraftUpdate({ docMedical: newDM });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Diagnostic Retenu & Conclusion Clinique' : 'Diagnosis & Conclusion'}
                  </label>
                  <input
                    type="text"
                    value={docMedical.conclusion}
                    onChange={(e) => {
                      const newDM = { ...docMedical, conclusion: e.target.value };
                      setDocMedical(newDM);
                      notifyDraftUpdate({ docMedical: newDM });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none font-semibold text-teal-300"
                  />
                </div>
              </div>
            )}

            {/* 7. DYNAMIC PANEL: PROCHAIN RENDEZ-VOUS (Follow-up Appointment Scheduling) */}
            {activeDocType === 'prochain_rdv' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      {lang === 'fr' ? 'Programmation du Prochain Rendez-vous de Suivi' : 'Schedule Next Follow-up Appointment'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Planifier une consultation ultérieure pour ce patient' : 'Book a follow-up visit for this patient'}
                    </p>
                  </div>
                  {apptBookingStatus && (
                    <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {apptBookingStatus}
                    </span>
                  )}
                </div>

                {/* Quick Date Presets */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">
                    {lang === 'fr' ? 'Délais Recommandés :' : 'Quick Date Presets:'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: lang === 'fr' ? '+ 3 Jours' : '+ 3 Days', days: 3 },
                      { label: lang === 'fr' ? '+ 1 Semaine' : '+ 1 Week', days: 7 },
                      { label: lang === 'fr' ? '+ 2 Semaines' : '+ 2 Weeks', days: 14 },
                      { label: lang === 'fr' ? '+ 1 Mois' : '+ 1 Month', days: 30 }
                    ].map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + preset.days);
                          const dateStr = d.toISOString().split('T')[0];
                          const newNRDV = { ...nextAppointment, date: dateStr };
                          setNextAppointment(newNRDV);
                          notifyDraftUpdate({ nextAppointment: newNRDV });
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Date du RDV' : 'Appointment Date'}
                    </label>
                    <input
                      type="date"
                      value={nextAppointment.date}
                      onChange={(e) => {
                        const newNRDV = { ...nextAppointment, date: e.target.value };
                        setNextAppointment(newNRDV);
                        notifyDraftUpdate({ nextAppointment: newNRDV });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Heure du RDV' : 'Time'}
                    </label>
                    <input
                      type="time"
                      value={nextAppointment.time}
                      onChange={(e) => {
                        const newNRDV = { ...nextAppointment, time: e.target.value };
                        setNextAppointment(newNRDV);
                        notifyDraftUpdate({ nextAppointment: newNRDV });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Motif du Rendez-vous de Suivi' : 'Reason for Visit'}
                  </label>
                  <input
                    type="text"
                    value={nextAppointment.reason}
                    onChange={(e) => {
                      const newNRDV = { ...nextAppointment, reason: e.target.value };
                      setNextAppointment(newNRDV);
                      notifyDraftUpdate({ nextAppointment: newNRDV });
                    }}
                    placeholder={lang === 'fr' ? 'ex: Control d\'otite droite, Ablation de fils...' : 'ex: Follow up check...'}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none font-semibold text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Remarques / Instructions pour le RDV' : 'Notes / Instructions'}
                  </label>
                  <textarea
                    rows="2"
                    value={nextAppointment.notes}
                    onChange={(e) => {
                      const newNRDV = { ...nextAppointment, notes: e.target.value };
                      setNextAppointment(newNRDV);
                      notifyDraftUpdate({ nextAppointment: newNRDV });
                    }}
                    placeholder={lang === 'fr' ? 'ex: Venir à jeun avec les résultats du bilan sanguin...' : 'ex: Bring blood test results...'}
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                  ></textarea>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleBookNextApptNow}
                    disabled={isBookingAppt || !nextAppointment.date}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4" />
                    {isBookingAppt ? (lang === 'fr' ? 'Réservation...' : 'Booking...') : (lang === 'fr' ? 'Valider le RDV dans l\'Agenda' : 'Book Appointment Now')}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
