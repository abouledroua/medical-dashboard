import React, { useState, useEffect, useRef } from 'react';
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
  FileCheck2,
  UserCheck,
  Edit3,
  History,
  Download,
  RefreshCw,
  ListChecks,
  Search,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { translations } from '../translations';
import PatientOverviewPanel from './PatientOverviewPanel';
import { generatePrescriptionHtml } from './prescriptionTemplates';
import { renderBilanBody } from './prescriptionTemplates/documentBodies';
import ReplacePrescriptionModal from './consultation/ReplacePrescriptionModal';
import { useConfirm } from '../context/ConfirmDialogContext';

export default function AddConsultationModal({ draft, patient, patients = [], onSelectPatient, onConsultationAdded, onCancel, onUpdateDraft, onClose, onEditPatient, onOpenNewConsultation, lang = 'fr', clinicInfo }) {
  const confirm = useConfirm();
  const t = translations[lang] || translations.fr;
  const activePatient = patient || draft?.patient || (patients && patients.length > 0 ? patients[0] : null);

  // Active Dynamic Document Tab Selection:
  // 'ordonnance' | 'certificat' | 'bilan' | 'orientation' | 'arret_travail' | 'doc_medical'
  const [activeDocType, setActiveDocType] = useState(draft?.activeDocType || 'ordonnance');

  // 1. ORDONNANCE (Prescriptions) State
  const initialPrescriptionMode = draft?.prescriptionMode || (Number(clinicInfo?.GEST_ORDONNANCE) === 2 ? 'prescription' : 'medicaments');
  const [prescriptionMode, setPrescriptionMode] = useState(initialPrescriptionMode);
  const [freeTextPrescription, setFreeTextPrescription] = useState(
    draft?.freeTextPrescription || ''
  );

  useEffect(() => {
    if (clinicInfo?.GEST_ORDONNANCE && !draft?.prescriptionMode) {
      setPrescriptionMode(Number(clinicInfo.GEST_ORDONNANCE) === 2 ? 'prescription' : 'medicaments');
    }
  }, [clinicInfo?.GEST_ORDONNANCE]);

  // Single-line medication entry form states & refs
  const inputMedRef = useRef(null);
  const inputFormeRef = useRef(null);
  const inputDosageRef = useRef(null);
  const inputFreqRef = useRef(null);
  const inputDurationRef = useRef(null);

  const [newRxName, setNewRxName] = useState('');
  const [newRxForme, setNewRxForme] = useState('');
  const [selectedFormeId, setSelectedFormeId] = useState(null);
  const [newRxDosage, setNewRxDosage] = useState('');
  const [newRxFrequency, setNewRxFrequency] = useState('');
  const [newRxDuration, setNewRxDuration] = useState('');

  // Forme suggestions state
  const formeOptions = [
    'Comprimé', 'Gélule', 'Sirop', 'Injectable', 'Pommade', 'Collyre', 'Spray',
    'Sachet', 'Ampoule', 'Solution', 'Gouttes', 'Crème', 'Suppositoire', 'Suspension'
  ];
  const [showFormeDropdown, setShowFormeDropdown] = useState(false);
  const [focusedFormeIdx, setFocusedFormeIdx] = useState(-1);

  // Medication DB suggestions states (medicament.DESIGNATION)
  const [selectedMedId, setSelectedMedId] = useState(null);
  const [medDbSuggestions, setMedDbSuggestions] = useState([]);
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const [focusedSuggestionIdx, setFocusedSuggestionIdx] = useState(-1);

  // Dosage DB suggestions states (dosage.DOSAGE for selected ID_MEDICAMENT and ID_FORME)
  const [dosageSuggestions, setDosageSuggestions] = useState([]);
  const [showDosageDropdown, setShowDosageDropdown] = useState(false);
  const [focusedDosageIdx, setFocusedDosageIdx] = useState(-1);

  // Posologie / Fréquence DB suggestions states (details_ordonnance_exercice.FREQUENCE)
  const [freqSuggestions, setFreqSuggestions] = useState([]);
  const [showFreqDropdown, setShowFreqDropdown] = useState(false);
  const [focusedFreqIdx, setFocusedFreqIdx] = useState(-1);

  // Durée / Quantité DB suggestions states (qte.DESIGNATION)
  const [durationSuggestions, setDurationSuggestions] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [focusedDurationIdx, setFocusedDurationIdx] = useState(-1);

  // Freeform Prescription DB suggestions states (medicament_p.PRESCRIPTION)
  const [freeTextSuggestions, setFreeTextSuggestions] = useState([]);
  const [showFreeTextDropdown, setShowFreeTextDropdown] = useState(false);
  const [focusedFreeTextIdx, setFocusedFreeTextIdx] = useState(-1);

  // Fetch medication suggestions from DB table 'medicament'
  useEffect(() => {
    if (!newRxName || !newRxName.trim()) {
      setMedDbSuggestions([]);
      setShowMedDropdown(false);
      return;
    }

    const handler = setTimeout(() => {
      fetch(`/api/medications/suggestions?q=${encodeURIComponent(newRxName.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMedDbSuggestions(data);
            setShowMedDropdown(data.length > 0);
          } else {
            setMedDbSuggestions([]);
            setShowMedDropdown(false);
          }
        })
        .catch(() => {
          setMedDbSuggestions([]);
          setShowMedDropdown(false);
        });
    }, 200);

    return () => clearTimeout(handler);
  }, [newRxName]);

  // Helper to extract default assure info from patient
  const getDefaultAssureInfo = (p) => {
    if (!p) return { fullname: '', age: '', typeAge: 'ans', sexe: 'M', infoSupp: '' };

    // Extract fullname from all possible property variations (both uppercase DB fields and camelCase JS fields)
    const nom = p.NOM || p.nom || p.lastName || p.nomMalade || p.Nom || '';
    const prenom = p.PRENOM || p.prenom || p.firstName || p.prenomMalade || p.Prenom || '';
    let fullname = [nom, prenom].filter(Boolean).join(' ');
    if (!fullname) {
      fullname = p.FULLNAME || p.fullname || p.fullName || p.name || p.NAME || '';
    }

    // Extract sex
    const rawSexe = (p.SEXE || p.sexe || p.gender || p.GENDER || 'M').toString().toUpperCase();
    const sexe = rawSexe.startsWith('F') ? 'F' : 'M';

    // Extract additional info
    const infoSupp = p.infoSupp || p.INFO_SUP || p.info_sup || '';

    // Extract age
    const rawAge = p.AGE !== undefined ? p.AGE : p.age;
    if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
      let typeAge = 'ans';
      const rawType = p.TYPE || p.type || p.typeAge || p.TYPE_AGE;
      const tNum = Number(rawType);
      if (tNum === 2 || rawType === 'mois') typeAge = 'mois';
      else if (tNum === 3 || rawType === 'jours') typeAge = 'jours';
      else if (typeof rawType === 'string' && rawType) typeAge = rawType;

      return { fullname, age: String(rawAge), typeAge, sexe, infoSupp };
    }

    // Fallback: calculate age from birth date if available
    const dobStr = p.DATE_NAISSANCE || p.dateNaissance || p.dob || p.birthDate;
    if (dobStr) {
      const dob = new Date(dobStr);
      if (!isNaN(dob.getTime())) {
        const now = new Date();
        let diffYears = now.getFullYear() - dob.getFullYear();
        let diffMonths = now.getMonth() - dob.getMonth();
        let diffDays = now.getDate() - dob.getDate();

        if (diffDays < 0) diffMonths -= 1;
        if (diffMonths < 0) {
          diffYears -= 1;
          diffMonths += 12;
        }

        if (diffYears >= 1) {
          return { fullname, age: String(diffYears), typeAge: 'ans', sexe, infoSupp };
        } else if (diffMonths >= 1) {
          return { fullname, age: String(diffMonths), typeAge: 'mois', sexe, infoSupp };
        } else {
          const totalDays = Math.max(1, Math.floor((now - dob) / (1000 * 60 * 60 * 24)));
          return { fullname, age: String(totalDays), typeAge: 'jours', sexe, infoSupp };
        }
      }
    }

    return { fullname, age: '', typeAge: 'ans', sexe, infoSupp };
  };

  const getPatientDisplayAge = (p) => {
    if (!p) return '—';
    const rawAge = p.AGE !== undefined && p.AGE !== null && p.AGE !== '' ? p.AGE : (p.age !== undefined && p.age !== null && p.age !== '' ? p.age : '');
    const rawType = p.TYPE || p.type || p.typeAge;
    let typeAge = 'ans';
    const tNum = Number(rawType);
    if (tNum === 2 || rawType === 'mois') typeAge = 'mois';
    else if (tNum === 3 || rawType === 'jours') typeAge = 'jours';
    else if (typeof rawType === 'string' && rawType) typeAge = rawType;

    if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
      return `${rawAge} ${typeAge}`;
    }

    const calculated = getDefaultAssureInfo(p);
    if (calculated && calculated.age) {
      return `${calculated.age} ${calculated.typeAge || 'ans'}`;
    }

    return '—';
  };

  // 0. ASSURÉ (Insured Person) State - Defaults to active patient info (fullname, age, typeAge, sexe, infoSupp)
  const [assureInfo, setAssureInfo] = useState(
    draft?.assureInfo || getDefaultAssureInfo(activePatient)
  );
  const [showAssurePanel, setShowAssurePanel] = useState(false);
  const [showInfoSupp, setShowInfoSupp] = useState(false);
  const [showPastPrescriptionsModal, setShowPastPrescriptionsModal] = useState(false);
  const [pastConsultationsList, setPastConsultationsList] = useState([]);
  const [loadingPastPrescriptions, setLoadingPastPrescriptions] = useState(false);
  const [showReplaceConfirmModal, setShowReplaceConfirmModal] = useState(false);
  const [pendingRxToLoad, setPendingRxToLoad] = useState(null);

  useEffect(() => {
    if (activePatient && !draft?.assureInfo) {
      setAssureInfo(getDefaultAssureInfo(activePatient));
    }
  }, [activePatient?.id, activePatient?.codeBarre, activePatient?.mrn]);

  const [prescriptions, setPrescriptions] = useState(
    Array.isArray(draft?.prescriptions) ? draft.prescriptions : []
  );

  // 2. CERTIFICAT MÉDICAL State
  const [certificat, setCertificat] = useState(
    draft?.certificat || {
      type: 'Certificat Médical Descriptif',
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 3,
      content: `Je soussigné, ${clinicInfo?.doctorNameFr || 'le médecin traitant'}, certifie avoir examiné ce jour le patient susnommé et avoir constaté des signes cliniques nécessitant un repos et un traitement médical approprié.`,
      fitness: 'apte'
    }
  );

  // 3. BILAN (Lab Work & Radiology Requests) State
  const [bilanMode, setBilanMode] = useState(draft?.bilanMode || 'selection');
  const [bilanCocheRows, setBilanCocheRows] = useState([]);
  const [loadingBilanCoche, setLoadingBilanCoche] = useState(false);
  const [showBilanModal, setShowBilanModal] = useState(false);
  const [editingBilanIndex, setEditingBilanIndex] = useState(null);
  const [bilanSearch, setBilanSearch] = useState('');
  const [selectedBilans, setSelectedBilans] = useState({
    FNS: false, GROUPAGE: false, TP: false, FIBROGENE: false, VS: false,
    FER: false, FERRITINE: false, GLYCEMIE: false, HBA1C: false, SGOT: false,
    GAMMA: false, BILIRUBINEMIE: false, TOTALE: false, CONJUGE: false, NONCONJUGE: false,
    UREE: false, ECBU: false, CHOLESTEROL: false, HDL: false, LDL: false,
    TRIGLYCERIDE: false, KALIEMIE: false, CALCEMIE: false, RUBEOLE: false,
    TOXOPLASMOSE: false, SYPHIS: false, HIV: false, URIQUE: false, CRP: false,
    ALBUMINEMIE: false, PROTEIN: false, PROTEIN24: false, FT3: false, FSH: false,
    TSHUS: false, LH: false, ASAT: false, PHOSPHATASES: false, ASLO: false,
    PROLACTINE: false, AMH: false, PROGESTERONE: false, DHEA: false, DELTA: false,
    ETF: false, EEG: false, VIT_D: false, ELETRO_HEMOG: false, DOSAGE_DEPAKINE: false,
    RADIO_MAIN: false, TELETHORAX: false, COPRO_PARASIT: false, DOSAGE_HORM_CROISS: false,
    SEROLOGIE_MALADIE_COELIAQUE: false, ACS: false, ANTI_TRANSGLUT: false,
    ANTIENDOM: false, ANTI_GLIADINE: false, AUTRE: ''
  });

  const buildBilanDesignation = (b) => {
    const parts = [];
    if (b.FNS) parts.push('FNS');
    if (b.GROUPAGE) parts.push('Groupage Sanguin');
    if (b.TP) parts.push('TP-TCK');
    if (b.FIBROGENE) parts.push('Taux de Fibrogène');
    if (b.VS) parts.push('VS');
    if (b.FER) parts.push('Fer Sérique');
    if (b.FERRITINE) parts.push('Ferritine');
    if (b.GLYCEMIE) parts.push('Glycémie à jeun');
    if (b.HBA1C) parts.push('HbA1C');
    if (b.SGOT) parts.push('SGOT - SGPT');
    if (b.GAMMA) parts.push('Gamma GT - Phosphates Alcalines');

    if (b.BILIRUBINEMIE) {
      const sub = [];
      if (b.TOTALE) sub.push('Total');
      if (b.CONJUGE) sub.push('Conjugée');
      if (b.NONCONJUGE) sub.push('Non Conjugée');
      parts.push(`Bilirubinémie${sub.length ? ' (' + sub.join(', ') + ')' : ''}`);
    }

    if (b.UREE) parts.push('Urée - Créatinémie');
    if (b.ECBU) parts.push('ECBU');
    if (b.CHOLESTEROL) parts.push('Cholestérol Total');
    if (b.HDL) parts.push('HDL Cholestérol');
    if (b.LDL) parts.push('LDL Cholestérol');
    if (b.TRIGLYCERIDE) parts.push('Triglycéride');
    if (b.KALIEMIE) parts.push('Kaliémie - Natrémie');
    if (b.CALCEMIE) parts.push('Calcémie - Phosphosémie');
    if (b.RUBEOLE) parts.push('Sérologie de la Rubéole');
    if (b.TOXOPLASMOSE) parts.push('Sérologie de la Toxoplasmose');
    if (b.SYPHIS) parts.push('Sérologie de la Syphilis');
    if (b.HIV) parts.push('Sérologie HIV');
    if (b.URIQUE) parts.push("Taux d'acide Urique");
    if (b.CRP) parts.push('CRP');
    if (b.ALBUMINEMIE) parts.push('Albuminémie');
    if (b.PROTEIN) parts.push('Protéinurie');
    if (b.PROTEIN24) parts.push('Protéinurie de 24h');
    if (b.FT3) parts.push('FT 3 - FT 4');
    if (b.FSH) parts.push('FSH');
    if (b.TSHUS) parts.push('TSHus');
    if (b.LH) parts.push('LH');
    if (b.ASAT) parts.push('ASAT - ALAT');
    if (b.PHOSPHATASES) parts.push('Phosphatases Alcalines');
    if (b.ASLO) parts.push('ASLO');
    if (b.PROLACTINE) parts.push('Prolactine');
    if (b.AMH) parts.push('AMH');
    if (b.PROGESTERONE) parts.push('Progestérone');
    if (b.DHEA) parts.push('S - DHEA');
    if (b.DELTA) parts.push('Delta 4 androstènedione');
    if (b.ETF) parts.push('ETF');
    if (b.EEG) parts.push('EEG');
    if (b.VIT_D) parts.push('Dosage Vitamine D');
    if (b.ELETRO_HEMOG) parts.push("Electrophorèse de l'hémoglobine");
    if (b.DOSAGE_DEPAKINE) parts.push('Dosage Dépakine');
    if (b.RADIO_MAIN) parts.push('Radio de la main');
    if (b.TELETHORAX) parts.push('Téléthorax');
    if (b.COPRO_PARASIT) parts.push('Copro-parasitologie des selles');
    if (b.DOSAGE_HORM_CROISS) parts.push("Dosage de l'hormone de croissance");

    if (b.SEROLOGIE_MALADIE_COELIAQUE) {
      const sub = [];
      if (b.ACS) sub.push('ACS');
      if (b.ANTI_TRANSGLUT) sub.push('Anti-transglutaminase');
      if (b.ANTIENDOM) sub.push('Antiendomisum');
      if (b.ANTI_GLIADINE) sub.push('Anti gliadine');
      parts.push(`Sérologie de la maladie cœliaque${sub.length ? ' (' + sub.join(', ') + ')' : ''}`);
    }

    if (b.AUTRE && b.AUTRE.trim()) {
      parts.push(b.AUTRE.trim());
    }

    return parts.join(', ');
  };

  const parseDesignationToSelected = (des = '') => {
    return {
      FNS: des.includes('FNS'),
      GROUPAGE: des.includes('Groupage Sanguin'),
      TP: des.includes('TP-TCK'),
      FIBROGENE: des.includes('Taux de Fibrogène'),
      VS: des.includes('VS'),
      FER: des.includes('Fer Sérique'),
      FERRITINE: des.includes('Ferritine'),
      GLYCEMIE: des.includes('Glycémie') || des.includes('Glycemie'),
      HBA1C: des.includes('HbA1C'),
      SGOT: des.includes('SGOT'),
      GAMMA: des.includes('Gamma GT'),
      BILIRUBINEMIE: des.includes('Bilirubinémie') || des.includes('Bilirubinemie'),
      TOTALE: des.includes('Total'),
      CONJUGE: des.includes('Conjugée') || des.includes('Conjugee'),
      NONCONJUGE: des.includes('Non Conjugée') || des.includes('Non Conjugee'),
      UREE: des.includes('Urée') || des.includes('Uree'),
      ECBU: des.includes('ECBU'),
      CHOLESTEROL: des.includes('Cholestérol') || des.includes('Cholestérole') || des.includes('Cholesterol'),
      HDL: des.includes('HDL'),
      LDL: des.includes('LDL'),
      TRIGLYCERIDE: des.includes('Triglycéride') || des.includes('Triglyceride'),
      KALIEMIE: des.includes('Kaliémie') || des.includes('Kaliemie'),
      CALCEMIE: des.includes('Calcémie') || des.includes('Calcemie'),
      RUBEOLE: des.includes('Rubéole') || des.includes('Rubeole'),
      TOXOPLASMOSE: des.includes('Toxoplasmose'),
      SYPHIS: des.includes('Syphilis') || des.includes('Syphis'),
      HIV: des.includes('HIV'),
      URIQUE: des.includes('Urique'),
      CRP: des.includes('CRP'),
      ALBUMINEMIE: des.includes('Albuminémie') || des.includes('Albuminemie'),
      PROTEIN: des.includes('Proteinurie') && !des.includes('24h'),
      PROTEIN24: des.includes('Proteinurie de 24h') || des.includes('24h'),
      FT3: des.includes('FT 3') || des.includes('FT3'),
      FSH: des.includes('FSH') || des.includes('FHS'),
      TSHUS: des.includes('TSHus'),
      LH: des.includes('LH'),
      ASAT: des.includes('ASAT'),
      PHOSPHATASES: des.includes('Phosphatases'),
      ASLO: des.includes('ASLO'),
      PROLACTINE: des.includes('Prolactine'),
      AMH: des.includes('AMH'),
      PROGESTERONE: des.includes('Progestérone') || des.includes('Progesterone'),
      DHEA: des.includes('DHEA'),
      DELTA: des.includes('Delta 4'),
      ETF: des.includes('ETF'),
      EEG: des.includes('EEG'),
      VIT_D: des.includes('Vitamine D'),
      ELETRO_HEMOG: des.includes('hemoglobine') || des.includes('hémoglobine'),
      DOSAGE_DEPAKINE: des.includes('depakine') || des.includes('Dépakine'),
      RADIO_MAIN: des.includes('Radio de la main'),
      TELETHORAX: des.includes('Telethorax') || des.includes('Téléthorax'),
      COPRO_PARASIT: des.includes('Copro-parasitologie'),
      DOSAGE_HORM_CROISS: des.includes('croissance'),
      SEROLOGIE_MALADIE_COELIAQUE: des.includes('coeliaque') || des.includes('cœliaque'),
      ACS: des.includes('ACS'),
      ANTI_TRANSGLUT: des.includes('Anti-transglutaminase'),
      ANTIENDOM: des.includes('Antiendomisum'),
      ANTI_GLIADINE: des.includes('Anti gliadine'),
      AUTRE: ''
    };
  };

  const handleOpenBilanAddOrEdit = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIdx = bilanCocheRows.findIndex(r => {
      if (draft?.idConsultation && r.ID_CONSULTATION === draft.idConsultation) return true;
      if (r.DATE_BILAN && r.DATE_BILAN.startsWith(todayStr)) return true;
      return false;
    });

    if (existingIdx !== -1) {
      // Row already exists for this consultation -> open in edit mode!
      setEditingBilanIndex(existingIdx);
      setSelectedBilans(parseDesignationToSelected(bilanCocheRows[existingIdx].DESIGNATION));
    } else {
      // New row for this consultation -> open in create mode!
      setEditingBilanIndex(null);
      const keys = Object.keys(selectedBilans);
      const cleared = {};
      keys.forEach(k => { cleared[k] = k === 'AUTRE' ? '' : false; });
      setSelectedBilans(cleared);
    }
    setShowBilanModal(true);
  };

  const [bilan, setBilan] = useState(
    draft?.bilan || {
      bioExams: ['NFS / Plaquettes', 'VS / CRP'],
      imgExams: ['Radiographie du Thorax'],
      customExam: '',
      clinicalIndication: 'Bilan de contrôle ORL et recherche de syndrome inflammatoire.',
      freeText: ''
    }
  );

  const [saisieError, setSaisieError] = useState('');

  const fetchBilanCocheHistory = (pId) => {
    const patId = pId || activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!patId) {
      setBilanCocheRows([]);
      return;
    }
    setLoadingBilanCoche(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/bilan-coche`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBilanCocheRows(data);
      })
      .catch(() => setBilanCocheRows([]))
      .finally(() => setLoadingBilanCoche(false));
  };

  const handleAddFreeTextBilan = async () => {
    const textToAdd = (bilan.freeText || '').trim();
    if (!textToAdd) {
      setSaisieError(lang === 'fr' ? 'Le champ bilan ne peut pas être vide.' : 'Bilan request cannot be empty.');
      return;
    }

    setSaisieError('');

    // 1. Persist to DB via /api/patients/:id/bilan-saisie (parses items, saves to bilans_consult & bilan)
    const pId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (pId) {
      try {
        await fetch(`/api/patients/${encodeURIComponent(pId)}/bilan-saisie`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToAdd })
        });
        fetchBilanCocheHistory(pId);
      } catch (err) {
        console.error('Error saving free text bilan to DB:', err);
      }
    }

    // 2. Clear text input
    const newBilan = { ...bilan, freeText: '' };
    setBilan(newBilan);
    notifyDraftUpdate({ bilan: newBilan });
  };

  const formatDateToLocale = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US');
    } catch (e) {
      return dateString;
    }
  };

  const handleDeleteBilan = async (row) => {
    const confirmObj = confirm({
      title: lang === 'fr' ? 'Supprimer le Bilan' : 'Delete Bilan',
      message: lang === 'fr'
        ? `Voulez-vous vraiment supprimer ce bilan du ${formatDateToLocale(row.DATE_BILAN)} ?`
        : `Are you sure you want to delete this bilan from ${formatDateToLocale(row.DATE_BILAN)}?`,
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : 'Cancel',
      variant: 'danger'
    });

    const ok = await confirmObj;
    if (!ok) return;

    const patId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!patId) return;

    const idConsult = row.ID_CONSULTATION;
    const exYear = row.EXERCICE || new Date().getFullYear();

    const res = await fetch(`/api/patients/${encodeURIComponent(patId)}/bilan-coche/${idConsult}/${exYear}`, { method: 'DELETE' });
    if (res.ok) {
      fetchBilanCocheHistory(patId);
    }
  };

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
  const [arretTravail, setArretTravail] = useState(() => {
    const rawReason = draft?.arretTravail?.reason;
    const sanitizedReason = (rawReason === 'Maladie - Repos médical strict à domicile') ? '' : (rawReason || '');
    return {
      type: draft?.arretTravail?.type || 'arret',
      days: draft?.arretTravail?.days || 3,
      startDate: draft?.arretTravail?.startDate || new Date().toISOString().split('T')[0],
      reason: sanitizedReason,
      allowedOutings: true,
      outingHours: '10h-12h et 15h-17h',
      idConsultation: draft?.arretTravail?.idConsultation || null,
      exercice: draft?.arretTravail?.exercice || null
    };
  });

  const [arretHistory, setArretHistory] = useState([]);
  const [loadingArretHistory, setLoadingArretHistory] = useState(false);
  const [savingArret, setSavingArret] = useState(false);
  const [arretSaveStatus, setArretSaveStatus] = useState('');

  const fetchArretHistory = (pId) => {
    const patId = pId || activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!patId) {
      setArretHistory([]);
      return;
    }
    setLoadingArretHistory(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/arret-history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setArretHistory(data);
        else setArretHistory([]);
      })
      .catch(() => setArretHistory([]))
      .finally(() => setLoadingArretHistory(false));
  };

  const handleDeleteArret = async (row) => {
    const confirmObj = confirm({
      title: lang === 'fr' ? 'Supprimer l\'Arrêt de Travail' : 'Delete Sick Leave',
      message: lang === 'fr'
        ? `Voulez-vous vraiment supprimer cet arrêt de travail (${formatDateToLocale(row.dateDebut)} - ${formatDateToLocale(row.dateFin)}) ?`
        : `Are you sure you want to delete this sick leave record (${formatDateToLocale(row.dateDebut)} - ${formatDateToLocale(row.dateFin)})?`,
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : 'Cancel',
      variant: 'danger'
    });

    const ok = await confirmObj;
    if (!ok) return;

    const patId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!patId) return;

    const idConsult = row.ID_CONSULTATION || row.idConsultation;
    const exYear = row.EXERCICE || row.exercice || new Date().getFullYear();

    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patId)}/arret/${idConsult}/${exYear}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchArretHistory(patId);
        if (arretTravail.idConsultation === idConsult) {
          setArretTravail({ type: 'arret', days: '3', startDate: new Date().toISOString().split('T')[0], reason: '', idConsultation: null, exercice: null });
        }
      }
    } catch (err) {
      console.error('Failed to delete sick leave:', err);
    }
  };

  const numberToWordOnly = (n, currentLang = lang) => {
    const num = parseInt(n, 10);
    if (isNaN(num) || num <= 0) return '';

    if (currentLang === 'en') {
      const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const tens = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      let res = '';
      if (num < 20) res = units[num];
      else if (num < 100) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        res = u === 0 ? tens[t] : `${tens[t]}-${units[u]}`;
      } else res = String(num);
      return res.charAt(0).toUpperCase() + res.slice(1);
    }

    if (currentLang === 'ar') {
      const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
      const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
      if (num <= 19) return units[num] || String(num);
      if (num < 100) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        return u === 0 ? tens[t] : `${units[u]} و${tens[t]}`;
      }
      return String(num);
    }

    // French (default)
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

    let res = '';
    if (num < 20) res = units[num];
    else if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7) res = `soixante-${units[10 + u]}`;
      else if (t === 9) res = `quatre-vingt-${units[10 + u]}`;
      else if (u === 0) res = tens[t];
      else if (u === 1 && t !== 8) res = `${tens[t]}-et-un`;
      else res = `${tens[t]}-${units[u]}`;
    } else if (num === 100) {
      res = 'cent';
    } else {
      res = String(num);
    }

    return res.charAt(0).toUpperCase() + res.slice(1);
  };

  const numberToWords = (n, currentLang = lang) => {
    const num = parseInt(n, 10);
    if (isNaN(num) || num <= 0) return '';

    if (currentLang === 'en') {
      const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const tens = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

      let res = '';
      if (num < 20) res = units[num];
      else if (num < 100) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        res = u === 0 ? tens[t] : `${tens[t]}-${units[u]}`;
      } else {
        res = String(num);
      }
      const formatted = res.charAt(0).toUpperCase() + res.slice(1);
      return `${formatted} Day${num > 1 ? 's' : ''}`;
    }

    if (currentLang === 'ar') {
      const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
      const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

      if (num === 1) return 'يوم واحد';
      if (num === 2) return 'يومان';

      let numStr = '';
      if (num <= 10) {
        numStr = units[num];
        return `${numStr} أيام`;
      } else if (num < 20) {
        numStr = units[num];
        return `${numStr} يوماً`;
      } else if (num < 100) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        if (u === 0) numStr = tens[t];
        else numStr = `${units[u]} و${tens[t]}`;
        return `${numStr} يوماً`;
      }
      return `${num} يوماً`;
    }

    // French (default)
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

    let res = '';
    if (num < 20) res = units[num];
    else if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7) res = `soixante-${units[10 + u]}`;
      else if (t === 9) res = `quatre-vingt-${units[10 + u]}`;
      else if (u === 0) res = tens[t];
      else if (u === 1 && t !== 8) res = `${tens[t]}-et-un`;
      else res = `${tens[t]}-${units[u]}`;
    } else if (num === 100) {
      res = 'cent';
    } else {
      res = String(num);
    }

    const formatted = res.charAt(0).toUpperCase() + res.slice(1);
    return `${formatted} Jour${num > 1 ? 's' : ''}`;
  };

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

  const [doctor, setDoctor] = useState(draft?.doctor || clinicInfo?.doctorNameFr || '');
  const [department, setDepartment] = useState(draft?.department || activePatient?.department || 'ORL');

  useEffect(() => {
    if (clinicInfo?.doctorNameFr) {
      if (!draft?.doctor || !doctor) {
        setDoctor(clinicInfo.doctorNameFr);
      }
      setCertificat(prev => {
        if (prev.content && prev.content.includes('le médecin traitant')) {
          return { ...prev, content: prev.content.replace('le médecin traitant', clinicInfo.doctorNameFr) };
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
      .catch(() => { });

    return () => { isMounted = false; };
  }, [activePatient?.id, activePatient?.codeBarre, activePatient?.mrn]);

  // Fetch bilan history from DB for active patient
  useEffect(() => {
    fetchBilanCocheHistory();
    if (activeDocType === 'arret_travail') {
      fetchArretHistory();
    }
  }, [activeDocType, activePatient?.id, activePatient?.codeBarre, activePatient?.mrn]);

  // Sync state whenever active patient or draft changes
  useEffect(() => {
    if (draft) {
      if (draft.activeDocType) setActiveDocType(draft.activeDocType);
      if (draft.prescriptionMode !== undefined) setPrescriptionMode(draft.prescriptionMode);
      if (draft.bilanMode !== undefined) setBilanMode(draft.bilanMode);
      if (draft.freeTextPrescription !== undefined) setFreeTextPrescription(draft.freeTextPrescription);
      if (draft.prescriptions) setPrescriptions(draft.prescriptions);
      if (draft.assureInfo) setAssureInfo(draft.assureInfo);
      if (draft.certificat) setCertificat(draft.certificat);
      if (draft.bilan) setBilan(draft.bilan);
      if (draft.orientation) setOrientation(draft.orientation);
      if (draft.arretTravail) {
        const rawReason = draft.arretTravail.reason;
        const sanitizedReason = (rawReason === 'Maladie - Repos médical strict à domicile') ? '' : (rawReason || '');
        setArretTravail({ ...draft.arretTravail, reason: sanitizedReason });
      }
      if (draft.docMedical) setDocMedical(draft.docMedical);
      if (draft.nextAppointment) setNextAppointment(draft.nextAppointment);
      if (draft.doctor) setDoctor(draft.doctor);
      if (draft.department) setDepartment(draft.department);
    }
  }, [draft?.patientId, draft?.activeDocType, draft?.assureInfo, activePatient?.id, activePatient?.codeBarre]);

  // Auto-fetch today's consultation data for editing if patient already has a consultation today
  useEffect(() => {
    const pId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!pId) return;

    let isMounted = true;
    fetch(`/api/consultations/today?patientId=${encodeURIComponent(pId)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && data.exists && data.consultation) {
          const c = data.consultation;

          if (c.activeDocType) setActiveDocType(c.activeDocType);
          if (c.prescriptionMode !== undefined) setPrescriptionMode(c.prescriptionMode);
          if (c.bilanMode !== undefined) setBilanMode(c.bilanMode);
          if (c.freeTextPrescription !== undefined) setFreeTextPrescription(c.freeTextPrescription);
          if (Array.isArray(c.prescriptions)) setPrescriptions(c.prescriptions);
          if (c.assureInfo) setAssureInfo(c.assureInfo);
          if (c.certificat) setCertificat(c.certificat);
          if (c.bilan) setBilan(c.bilan);
          if (c.orientation) setOrientation(c.orientation);
          if (c.arretTravail) setArretTravail(c.arretTravail);
          if (c.docMedical) setDocMedical(c.docMedical);
          if (c.nextAppointment) setNextAppointment(c.nextAppointment);

          notifyDraftUpdate({
            isExisting: true,
            idConsultation: c.idConsultation,
            exercice: c.exercice,
            idVersement: c.idVersement,
            etat: c.etat,
            activeDocType: draft?.activeDocType || c.activeDocType || activeDocType,
            prescriptionMode: c.prescriptionMode !== undefined ? c.prescriptionMode : prescriptionMode,
            freeTextPrescription: c.freeTextPrescription !== undefined ? c.freeTextPrescription : freeTextPrescription,
            prescriptions: Array.isArray(c.prescriptions) ? c.prescriptions : prescriptions,
            assureInfo: c.assureInfo || assureInfo,
            certificat: c.certificat || certificat,
            bilan: c.bilan || bilan,
            orientation: c.orientation || orientation,
            arretTravail: c.arretTravail || arretTravail,
            docMedical: c.docMedical || docMedical,
            nextAppointment: c.nextAppointment || nextAppointment
          });
        }
      })
      .catch(err => console.error('Error fetching today consultation:', err));

    return () => { isMounted = false; };
  }, [activePatient?.id, activePatient?.codeBarre, activePatient?.mrn]);

  // Notify parent of draft updates so state is preserved across patient switches and F5 refreshes
  const notifyDraftUpdate = (updatedFields = {}) => {
    if (onUpdateDraft && activePatient) {
      onUpdateDraft({
        patientId: activePatient.id || activePatient.codeBarre,
        patient: activePatient,
        activeDocType: updatedFields.activeDocType || activeDocType,
        prescriptionMode: updatedFields.prescriptionMode !== undefined ? updatedFields.prescriptionMode : prescriptionMode,
        freeTextPrescription: updatedFields.freeTextPrescription !== undefined ? updatedFields.freeTextPrescription : freeTextPrescription,
        prescriptions: updatedFields.prescriptions || prescriptions,
        assureInfo: updatedFields.assureInfo || assureInfo,
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

  // Open Previous Prescriptions List Modal
  const handleOpenPastPrescriptions = () => {
    setShowPastPrescriptionsModal(true);
    const pId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!pId) return;

    const existingConsultations = fullPatientDetails?.consultations || activePatient?.consultations;
    if (Array.isArray(existingConsultations) && existingConsultations.length > 0) {
      const withRx = existingConsultations.filter(c => Array.isArray(c.prescriptions) && c.prescriptions.length > 0);
      withRx.sort((a, b) => {
        const dateA = String(a.date || a.dateStr || a.DATE_CONSULTATION || '');
        const dateB = String(b.date || b.dateStr || b.DATE_CONSULTATION || '');
        const numIdA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
        const numIdB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return numIdB - numIdA;
      });
      setPastConsultationsList(withRx);
      setLoadingPastPrescriptions(false);
      return;
    }

    setLoadingPastPrescriptions(true);
    fetch(`/api/patients/${encodeURIComponent(pId)}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.consultations)) {
          const withRx = data.consultations.filter(c => Array.isArray(c.prescriptions) && c.prescriptions.length > 0);
          withRx.sort((a, b) => {
            const dateA = String(a.date || a.dateStr || a.DATE_CONSULTATION || '');
            const dateB = String(b.date || b.dateStr || b.DATE_CONSULTATION || '');
            const numIdA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
            const numIdB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            return numIdB - numIdA;
          });
          setPastConsultationsList(withRx);
        }
      })
      .catch(err => console.error('Error fetching past prescriptions:', err))
      .finally(() => setLoadingPastPrescriptions(false));
  };

  // Handle Loading Past Prescription (with empty table check & confirm modal)
  const handleLoadPastPrescription = (rxList) => {
    if (!Array.isArray(rxList) || rxList.length === 0) return;
    const hasExistingMeds = prescriptions.some(p => p && p.name && p.name.trim().length > 0);

    if (hasExistingMeds) {
      setPendingRxToLoad(rxList);
      setShowReplaceConfirmModal(true);
    } else {
      applyPrescriptionLoad(rxList);
    }
  };

  const applyPrescriptionLoad = (rxList) => {
    const validRx = Array.isArray(rxList) ? rxList : (rxList?.rxList || rxList || []);
    setPrescriptions(validRx);
    notifyDraftUpdate({ prescriptions: validRx });
    setShowPastPrescriptionsModal(false);
    setShowReplaceConfirmModal(false);
    setPendingRxToLoad(null);
  };

  const handleMergePrescriptionLoad = (rxList) => {
    const validRx = Array.isArray(rxList) ? rxList : (rxList?.rxList || rxList || []);
    const existingClean = prescriptions.filter(p => p && p.name && p.name.trim().length > 0);
    const merged = [...existingClean, ...validRx];
    setPrescriptions(merged);
    notifyDraftUpdate({ prescriptions: merged });
    setShowPastPrescriptionsModal(false);
    setShowReplaceConfirmModal(false);
    setPendingRxToLoad(null);
  };

  // Print Prescription (supports current draft or custom past prescription)
  const handlePrintPrescription = (customRxList = null, customDate = null, customAssureInfo = null) => {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) {
      window.print();
      return;
    }

    // Helper function to extract normalized medication object regardless of string, object, or database column structure
    const extractMedInfo = (rx) => {
      if (!rx) return null;
      if (typeof rx === 'string') {
        const str = rx.trim();
        return str ? { name: str, dosage: '', frequency: '', duration: '', notes: '', type: 1 } : null;
      }
      if (typeof rx === 'object') {
        const name = (rx.name || rx.DESIGNATION || rx.MEDICAMENT || rx.prescription || rx.medication || rx.title || rx.label || '').toString().trim();
        if (!name) return null;
        return {
          name,
          dosage: (rx.dosage || rx.DOSAGE || rx.dosageVal || '').toString().trim(),
          frequency: (rx.frequency || rx.FREQUENCE || rx.POSOLOGIE || rx.posologie || '').toString().trim(),
          duration: (rx.duration || rx.DUREE || rx.QTE || rx.qte || rx.duree || '').toString().trim(),
          notes: (rx.instructions || rx.INSTRUCTIONS || rx.notes || '').toString().trim(),
          type: rx.type || 1
        };
      }
      return null;
    };

    const rxToPrint = (customRxList && Array.isArray(customRxList) && customRxList.length > 0)
      ? customRxList
      : (prescriptions && prescriptions.length > 0 ? prescriptions : (draft?.prescriptions || []));

    const dateToPrint = customDate || new Date().toLocaleDateString('fr-FR');
    const assureToPrint = customAssureInfo || assureInfo;

    const assureName = assureToPrint?.fullname || assureToPrint?.nom || assureToPrint?.ASSURE || [activePatient?.NOM || activePatient?.nom, activePatient?.PRENOM || activePatient?.prenom].filter(Boolean).join(' ') || activePatient?.name || '—';
    const assureAge = (assureToPrint?.age !== undefined && assureToPrint?.age !== null && assureToPrint?.age !== '') ? assureToPrint.age : (activePatient?.AGE !== undefined ? activePatient.AGE : '—');
    const assureTypeAge = assureToPrint?.typeAge || (Number(activePatient?.TYPE) === 2 ? 'mois' : Number(activePatient?.TYPE) === 3 ? 'jours' : 'ans');

    const doctorNameAr = clinicInfo?.doctorNameAr || clinicInfo?.NOM_AR || 'الحكيم سلوقي عادل';
    const specialtyFr = clinicInfo?.specialtyFr || clinicInfo?.SPECIALITE_FR || 'Spécialiste en Maladies et Chirurgie ORL • Thyroïde • Audition • Vertige';
    const addressFr = clinicInfo?.addressFr || clinicInfo?.ADRESSE_FR || 'El Hadjar ANNABA';
    const phoneFixe = clinicInfo?.fixe || clinicInfo?.TEL || clinicInfo?.phone || '';
    const ordre = clinicInfo?.ordre || clinicInfo?.NUM_ORDRE || '3876/23';
    const msgJaune = clinicInfo?.msgJaune || 'Selon la règlementation en vigueur, nous interdisons toute substitution de notre prescription des génériques algériens qui revient moins cher à la sécurité sociale.';
    const msgOrd = clinicInfo?.msgOrd || 'Sauver des vies - Donnez de votre sang';

    const clinicHeader = localStorage.getItem('clinicHeader') || clinicInfo?.header || clinicInfo?.IMAGE_ENTETE || clinicInfo?.entete || clinicInfo?.raw?.IMAGE_ENTETE;
    const clinicLogo = localStorage.getItem('clinicLogo') || clinicInfo?.logo || clinicInfo?.IMAGE_LOGO || clinicInfo?.logoImage || clinicInfo?.raw?.IMAGE_LOGO;

    // Standard Code 128-B SVG Barcode Generator (Scannable by all devices)
    const generateBarcodeSVG = (text) => {
      const str = String(text || '000000').trim();
      if (!str) return '';

      const CODE128_PATTERNS = [
        "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
        "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
        "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
        "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
        "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
        "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
        "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
        "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
        "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
        "214121", "412121", "111143", "111341", "113141", "114113", "114311", "411113", "411311", "113114",
        "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
      ];

      const codeValues = [104];
      let checksum = 104;

      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const val = (code >= 32 && code <= 126) ? (code - 32) : 0;
        codeValues.push(val);
        checksum += val * (i + 1);
      }

      codeValues.push(checksum % 103);
      codeValues.push(106);

      const quietZone = 10;
      const moduleWidth = 1.8;
      const barHeight = 48;

      let currentX = quietZone;
      let rects = '';

      codeValues.forEach((val) => {
        const pattern = CODE128_PATTERNS[val] || CODE128_PATTERNS[0];
        for (let i = 0; i < pattern.length; i++) {
          const width = parseInt(pattern[i], 10) * moduleWidth;
          if (i % 2 === 0) {
            rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${barHeight}" fill="#000" />`;
          }
          currentX += width;
        }
      });

      const totalWidth = Math.ceil(currentX + quietZone);

      return `<svg width="${totalWidth}" height="${barHeight}" viewBox="0 0 ${totalWidth} ${barHeight}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;"><rect width="100%" height="100%" fill="#fff" />${rects}</svg>`;
    };

    const patientBarcodeVal = activePatient?.codeBarre || activePatient?.mrn || activePatient?.id || '0000000';
    const rawBarcodeSetting = clinicInfo?.Affiche_CodeBarre ?? clinicInfo?.raw?.Affiche_CodeBarre ?? clinicInfo?.raw?.AFFICHE_CODEBARRE ?? clinicInfo?.AFFICHE_CODEBARRE;
    const showBarcode = rawBarcodeSetting === undefined || rawBarcodeSetting === null ? true : Number(rawBarcodeSetting) === 1;
    const barcodeSvg = showBarcode ? generateBarcodeSVG(patientBarcodeVal) : '';

    // Collect all medications from target list
    const validMedsToPrint = rxToPrint.map(extractMedInfo).filter(Boolean);

    let rxHtml = '';

    if (validMedsToPrint.length > 0) {
      rxHtml = validMedsToPrint.map((rx, idx) => {
        if (rx.type === 2) {
          return `
            <div style="margin-bottom: 12px; font-size: 13.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.5;">
              <strong style="color: #000;">${idx + 1}.</strong> ${rx.name}
            </div>
          `;
        }

        const subText = [rx.dosage, rx.frequency].filter(Boolean).join(' - ');

        return `
          <div style="margin-bottom: 14px; font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div style="font-weight: bold; font-size: 13.5px; text-transform: uppercase; color: #000;">
                ${idx + 1}. ${rx.name}
              </div>
              ${rx.duration ? `<div style="font-size: 13px; font-weight: normal; color: #000; font-family: 'Segoe UI', Arial, sans-serif; white-space: nowrap; margin-left: 15px;">${rx.duration}</div>` : ''}
            </div>
            ${subText ? `<div style="margin-left: 20px; margin-top: 2px; font-size: 12.5px; color: #111;">${subText}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    const freeTextToPrint = (freeTextPrescription && freeTextPrescription.trim()) || draft?.freeTextPrescription || '';
    if (freeTextToPrint && freeTextToPrint.trim() && !customRxList) {
      rxHtml += `
        <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.7; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-top: 10px;">
          ${freeTextToPrint.trim()}
        </div>
      `;
    }

    if (!rxHtml.trim()) {
      rxHtml = '<div style="font-size: 14px; color: #666; font-style: italic; padding: 20px 0;">Aucun médicament.</div>';
    }

    const patientSex = (assureToPrint?.sexe || activePatient?.SEXE || activePatient?.sexe || activePatient?.gender || 'M').toString().toUpperCase();
    const isFemale = patientSex.startsWith('F');
    const agePrefix = isFemale ? 'âgée de' : 'âgé de';

    const htmlContent = generatePrescriptionHtml({
      clinicInfo,
      doctorNameAr,
      specialtyFr,
      specialtyAr: clinicInfo?.specialtyAr,
      doctorNameFr: clinicInfo?.doctorNameFr,
      addressFr,
      phoneFixe,
      ordre,
      dateToPrint,
      assureName,
      assureAge,
      assureTypeAge,
      isFemale,
      agePrefix,
      rxHtml,
      prescriptionsCount: validMedsToPrint.length,
      clinicHeader,
      clinicLogo,
      doctor,
      barcodeSvg,
      msgJaune,
      msgOrd
    });

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
  };

  // Print Bilan (Lab/Radiology request) using Design 3 layout
  const handlePrintBilan = (rowToPrint = null) => {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) {
      window.print();
      return;
    }

    const formatDateToFrench = (dVal) => {
      if (!dVal) return new Date().toLocaleDateString('fr-FR');
      if (typeof dVal === 'string' && dVal.includes('/') && dVal.length <= 10) return dVal;
      try {
        const d = new Date(dVal);
        if (isNaN(d.getTime())) return String(dVal);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return String(dVal);
      }
    };

    const dateToPrint = formatDateToFrench(rowToPrint?.DATE_BILAN);
    const assureToPrint = assureInfo;

    const assureName = assureToPrint?.fullname || assureToPrint?.nom || assureToPrint?.ASSURE || [activePatient?.NOM || activePatient?.nom, activePatient?.PRENOM || activePatient?.prenom].filter(Boolean).join(' ') || activePatient?.name || '—';
    const assureAge = (assureToPrint?.age !== undefined && assureToPrint?.age !== null && assureToPrint?.age !== '') ? assureToPrint.age : (activePatient?.AGE !== undefined ? activePatient.AGE : '—');
    const assureTypeAge = assureToPrint?.typeAge || (Number(activePatient?.TYPE) === 2 ? 'mois' : Number(activePatient?.TYPE) === 3 ? 'jours' : 'ans');

    const doctorNameAr = clinicInfo?.doctorNameAr || clinicInfo?.NOM_AR || 'الحكيم سلوقي عادل';
    const specialtyFr = clinicInfo?.specialtyFr || clinicInfo?.SPECIALITE_FR || 'Spécialiste en Maladies et Chirurgie ORL • Thyroïde • Audition • Vertige';
    const addressFr = clinicInfo?.addressFr || clinicInfo?.ADRESSE_FR || 'El Hadjar ANNABA';
    const phoneFixe = clinicInfo?.fixe || clinicInfo?.TEL || clinicInfo?.phone || '';
    const ordre = clinicInfo?.ordre || clinicInfo?.NUM_ORDRE || '3876/23';
    const msgJaune = clinicInfo?.msgJaune || '';
    const msgOrd = clinicInfo?.msgOrd || 'Sauver des vies - Donnez de votre sang';

    const clinicHeader = localStorage.getItem('clinicHeader') || clinicInfo?.header || clinicInfo?.IMAGE_ENTETE || clinicInfo?.entete || clinicInfo?.raw?.IMAGE_ENTETE;
    const clinicLogo = localStorage.getItem('clinicLogo') || clinicInfo?.logo || clinicInfo?.IMAGE_LOGO || clinicInfo?.logoImage || clinicInfo?.raw?.IMAGE_LOGO;

    const patientBarcodeVal = activePatient?.codeBarre || activePatient?.mrn || activePatient?.id || '0000000';
    const rawBarcodeSetting = clinicInfo?.Affiche_CodeBarre ?? clinicInfo?.raw?.Affiche_CodeBarre ?? clinicInfo?.raw?.AFFICHE_CODEBARRE ?? clinicInfo?.AFFICHE_CODEBARRE;
    const showBarcode = rawBarcodeSetting === undefined || rawBarcodeSetting === null ? true : Number(rawBarcodeSetting) === 1;

    const generateBarcodeSVG = (text) => {
      const str = String(text || '000000').trim();
      if (!str) return '';
      const CODE128_PATTERNS = [
        "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
        "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
        "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
        "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
        "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
        "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
        "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
        "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
        "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
        "214121", "412121", "111143", "111341", "113141", "114113", "114311", "411113", "411311", "113114",
        "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
      ];
      const codeValues = [104];
      let checksum = 104;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const val = (code >= 32 && code <= 126) ? (code - 32) : 0;
        codeValues.push(val);
        checksum += val * (i + 1);
      }
      codeValues.push(checksum % 103);
      codeValues.push(106);
      const quietZone = 10;
      const moduleWidth = 1.8;
      const barHeight = 48;
      let currentX = quietZone;
      let rects = '';
      codeValues.forEach((val) => {
        const pattern = CODE128_PATTERNS[val] || CODE128_PATTERNS[0];
        for (let i = 0; i < pattern.length; i++) {
          const width = parseInt(pattern[i], 10) * moduleWidth;
          if (i % 2 === 0) {
            rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${barHeight}" fill="#000" />`;
          }
          currentX += width;
        }
      });
      const totalWidth = Math.ceil(currentX + quietZone);
      return `<svg width="${totalWidth}" height="${barHeight}" viewBox="0 0 ${totalWidth} ${barHeight}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;"><rect width="100%" height="100%" fill="#fff" />${rects}</svg>`;
    };

    const barcodeSvg = showBarcode ? generateBarcodeSVG(patientBarcodeVal) : '';

    let itemsStr = '';
    if (rowToPrint && rowToPrint.DESIGNATION) {
      itemsStr = rowToPrint.DESIGNATION;
    } else if (bilanCocheRows && bilanCocheRows.length > 0 && bilanCocheRows[0].DESIGNATION) {
      itemsStr = bilanCocheRows[0].DESIGNATION;
    } else {
      itemsStr = buildBilanDesignation(selectedBilans);
    }

    const rawList = itemsStr.split(/,|\n/).map(s => s.trim()).filter(Boolean);

    const documentSubtitle = lang === 'ar' ? 'الرجاء إجراء الفحوصات التالية :' : (lang === 'en' ? 'Please perform the following tests :' : 'Faire SVP les bilans suivants :');

    const rxHtml = renderBilanBody({
      rawList,
      documentSubtitle,
      lang
    });

    const patientSex = (assureToPrint?.sexe || activePatient?.SEXE || activePatient?.sexe || activePatient?.gender || 'M').toString().toUpperCase();
    const isFemale = patientSex.startsWith('F');
    const agePrefix = isFemale ? 'âgée de' : 'âgé de';

    const htmlContent = generatePrescriptionHtml({
      clinicInfo,
      doctorNameAr,
      specialtyFr,
      specialtyAr: clinicInfo?.specialtyAr,
      doctorNameFr: clinicInfo?.doctorNameFr,
      addressFr,
      phoneFixe,
      ordre,
      dateToPrint,
      assureName,
      assureAge,
      assureTypeAge,
      isFemale,
      agePrefix,
      rxHtml,
      prescriptionsCount: rawList.length,
      prescriptionsCountLabel: 'Examen(s)',
      documentTitle: 'BILAN',
      documentSubtitle: lang === 'ar' ? 'الرجاء إجراء الفحوصات التالية :' : (lang === 'en' ? 'Please perform the following tests :' : 'Faire SVP les bilans suivants :'),
      isBilan: true,
      clinicHeader,
      clinicLogo,
      doctor,
      barcodeSvg,
      msgJaune,
      msgOrd
    });

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 350);
  };

  const handleSaveArret = async () => {
    const pId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
    if (!pId) return;

    setSavingArret(true);
    setArretSaveStatus('');
    try {
      const endDate = calculateEndDate(arretTravail.startDate, arretTravail.days);
      const res = await fetch(`/api/patients/${encodeURIComponent(pId)}/arret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: arretTravail.days,
          startDate: arretTravail.startDate,
          endDate,
          reason: arretTravail.reason,
          type: arretTravail.type,
          idConsultation: arretTravail.idConsultation || null,
          exercice: arretTravail.exercice || null
        })
      });
      if (res.ok) {
        setArretSaveStatus(lang === 'fr' ? 'Arrêt enregistré avec succès' : 'Sick leave saved');
        setArretTravail(prev => ({ ...prev, idConsultation: null, exercice: null }));
        fetchArretHistory(pId);
        setTimeout(() => setArretSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error saving sick leave:', err);
    } finally {
      setSavingArret(false);
    }
  };

  const handlePrintArret = (rowItem = null) => { 
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) {
      window.print();
      return;
    }

    const item = rowItem || arretTravail;
    let typeVal = 1;
    if (typeof item.type === 'string') {
      typeVal = item.type === 'prolongation' ? 2 : item.type === 'reprise' ? 3 : 1;
    } else if (item.TYPE !== undefined) {
      typeVal = Number(item.TYPE);
    } else if (item.type !== undefined) {
      typeVal = Number(item.type);
    }

    const formatDateToFrench = (dVal) => {
      if (!dVal) return new Date().toLocaleDateString('fr-FR');
      if (typeof dVal === 'string' && dVal.includes('/') && dVal.length <= 10) return dVal;
      try {
        const d = new Date(dVal);
        if (isNaN(d.getTime())) return String(dVal);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return String(dVal);
      }
    };

    const dateToPrint = formatDateToFrench(item.dateArret || item.startDate || new Date());
    const assureToPrint = assureInfo;

    const assureName = assureToPrint?.fullname || assureToPrint?.nom || assureToPrint?.ASSURE || [activePatient?.NOM || activePatient?.nom, activePatient?.PRENOM || activePatient?.prenom].filter(Boolean).join(' ') || activePatient?.name || '—';
    const assureAge = (assureToPrint?.age !== undefined && assureToPrint?.age !== null && assureToPrint?.age !== '') ? assureToPrint.age : (activePatient?.AGE !== undefined ? activePatient.AGE : '—');
    const assureTypeAge = assureToPrint?.typeAge || (Number(activePatient?.TYPE) === 2 ? 'mois' : Number(activePatient?.TYPE) === 3 ? 'jours' : 'ans');

    const doctorNameAr = clinicInfo?.doctorNameAr || clinicInfo?.NOM_AR || 'الحكيم سلوقي عادل';
    const specialtyFr = clinicInfo?.specialtyFr || clinicInfo?.SPECIALITE_FR || 'Spécialiste en Maladies et Chirurgie ORL • Thyroïde • Audition • Vertige';
    const addressFr = clinicInfo?.addressFr || clinicInfo?.ADRESSE_FR || 'El Hadjar ANNABA';
    const phoneFixe = clinicInfo?.fixe || clinicInfo?.TEL || clinicInfo?.phone || '';
    const ordre = clinicInfo?.ordre || clinicInfo?.NUM_ORDRE || '3876/23';
    const msgJaune = clinicInfo?.msgJaune || '';
    const msgOrd = clinicInfo?.msgOrd || 'Sauver des vies - Donnez de votre sang';

    const clinicHeader = localStorage.getItem('clinicHeader') || clinicInfo?.header || clinicInfo?.IMAGE_ENTETE || clinicInfo?.entete || clinicInfo?.raw?.IMAGE_ENTETE;
    const clinicLogo = localStorage.getItem('clinicLogo') || clinicInfo?.logo || clinicInfo?.IMAGE_LOGO || clinicInfo?.logoImage || clinicInfo?.raw?.IMAGE_LOGO;

    const patientBarcodeVal = activePatient?.codeBarre || activePatient?.mrn || activePatient?.id || '0000000';
    const rawBarcodeSetting = clinicInfo?.Affiche_CodeBarre ?? clinicInfo?.raw?.Affiche_CodeBarre ?? clinicInfo?.raw?.AFFICHE_CODEBARRE ?? clinicInfo?.AFFICHE_CODEBARRE;
    const showBarcode = rawBarcodeSetting === undefined || rawBarcodeSetting === null ? true : Number(rawBarcodeSetting) === 1;

    const generateBarcodeSVG = (text) => {
      const str = String(text || '000000').trim();
      if (!str) return '';
      const CODE128_PATTERNS = [
        "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
        "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
        "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
        "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
        "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
        "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
        "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
        "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
        "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
        "214121", "412121", "111143", "111341", "113141", "114113", "114311", "411113", "411311", "113114",
        "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
      ];
      const codeValues = [104];
      let checksum = 104;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const val = (code >= 32 && code <= 126) ? (code - 32) : 0;
        codeValues.push(val);
        checksum += val * (i + 1);
      }
      codeValues.push(checksum % 103);
      codeValues.push(106);
      const quietZone = 10;
      const moduleWidth = 1.8;
      const barHeight = 48;
      let currentX = quietZone;
      let rects = '';
      codeValues.forEach((val) => {
        const pattern = CODE128_PATTERNS[val] || CODE128_PATTERNS[0];
        for (let i = 0; i < pattern.length; i++) {
          const width = parseInt(pattern[i], 10) * moduleWidth;
          if (i % 2 === 0) {
            rects += `<rect x="${currentX.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${barHeight}" fill="#000" />`;
          }
          currentX += width;
        }
      });
      const totalWidth = Math.ceil(currentX + quietZone);
      return `<svg width="${totalWidth}" height="${barHeight}" viewBox="0 0 ${totalWidth} ${barHeight}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;"><rect width="100%" height="100%" fill="#fff" />${rects}</svg>`;
    };

    const barcodeSvg = showBarcode ? generateBarcodeSVG(patientBarcodeVal) : '';

    const typeTitle = typeVal === 2
      ? (lang === 'fr' ? 'PROLONGATION D\'ARRÊT DE TRAVAIL' : 'SICK LEAVE EXTENSION')
      : typeVal === 3
      ? (lang === 'fr' ? 'CERTIFICAT DE REPRISE DE TRAVAIL' : 'RETURN TO WORK CERTIFICATE')
      : (lang === 'fr' ? 'CERTIFICAT D\'ARRÊT DE TRAVAIL' : 'SICK LEAVE CERTIFICATE');

    const daysCount = item.nbJour || item.days || 1;
    const startDate = formatDateToFrench(item.dateDebut || item.startDate);
    const endDate = formatDateToFrench(item.dateFin || calculateEndDate(item.startDate, daysCount));
    const returnDate = formatDateToFrench(calculateReturnDate(item.startDate || item.dateDebut, daysCount));
    const reasonText = item.obs || item.reason || '';

    const daysWordOnly = numberToWordOnly(daysCount, lang);

    const patientSex = (assureToPrint?.sexe || activePatient?.SEXE || activePatient?.sexe || activePatient?.gender || 'M').toString().toUpperCase();
    const isFemale = patientSex.startsWith('F');

    let bodyHtml = '';
    if (typeVal === 3) { // Reprise
      bodyHtml = `
        <div style="min-height: 200px; padding: 15px 5px; font-size: 15px; line-height: 1.8; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
          <p style="text-align: left; margin-bottom: 10px;">
            ${t.sickLeaveCertify}
          </p>
          <p style="text-align: left; margin-left: 20px; margin-bottom: 5px;">
            ${isFemale ? t.sickLeaveMrs : t.sickLeaveMr} : <strong style="text-transform: uppercase;">${assureName}</strong>
          </p>
          <p style="text-align: left; margin-left: 20px; margin-bottom: 10px;">
            ${isFemale ? t.sickLeaveBornF : t.sickLeaveBorn} ${t.sickLeaveOn} : <strong>${fullPatientDetails.dob || 'N/A'}</strong>
          </p>
          <p style="text-align: left; margin-left: 20px; margin-bottom: 2px;">
            ${lang === 'fr' ? 'Lui permet de reprendre son travail à dater' : 'Allows them to resume work starting from'}
          </p>
          <p style="text-align: left; margin-left: 40px; margin-bottom: 10px;">
            ${lang === 'fr' ? 'du :' : 'from :'} <strong>${startDate}</strong>
          </p>
          ${reasonText ? `<p style="text-align: left; margin-left: 20px; margin-bottom: 10px;"><strong>Observation : </strong>${reasonText}</p>` : ''}
          <p style="text-align: left; margin-bottom: 20px;">
            ${t.sickLeaveAsLegalRight}
          </p>
          <p style="text-align: right; margin-top: 30px;">
            ${t.sickLeaveTheDoctor}
          </p>
        </div>
      `;
    } else { // Arrêt ou Prolongation
      bodyHtml = `
        <div style="min-height: 200px; padding: 15px 5px; font-size: 15px; line-height: 1.8; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
          <p style="text-align: left; margin-bottom: 10px;">
            ${t.sickLeaveCertify}
          </p>
          <p style="text-align: left; margin-left: 20px; margin-bottom: 5px;">
            ${isFemale ? t.sickLeaveMrs : t.sickLeaveMr} : <strong style="text-transform: uppercase;">${assureName}</strong>
          </p>
          <p style="text-align: left; margin-left: 20px; margin-bottom: 10px;">
            ${isFemale ? t.sickLeaveBornF : t.sickLeaveBorn} ${t.sickLeaveOn} : <strong>${fullPatientDetails.dob || 'N/A'}</strong>
          </p>
          <p style="text-align: left; margin-left: 20px; margin-bottom: 5px;">
            ${typeVal === 2 ? (lang === 'fr' ? "Nécessite une prolongation d'arrêt de travail :" : "Requires a sick leave extension of:") : t.sickLeaveRequires}
          </p>
          <p style="text-align: left; margin-left: 40px; margin-bottom: 5px;">
            ${t.sickLeaveOf} : <strong>${daysCount}${daysWordOnly ? ` (${daysWordOnly})` : ''}</strong> ${t.sickLeaveDaysSuffix}
          </p>
          <p style="text-align: left; margin-left: 40px; margin-bottom: 10px;">
            ${t.sickLeaveFrom} : <strong>${startDate}</strong> ${t.sickLeaveTo} : <strong>${endDate}</strong> ${t.sickLeaveIncluded}
          </p>
          ${reasonText ? `<p style="text-align: left; margin-left: 20px; margin-bottom: 10px;"><strong>Observation : </strong>${reasonText}</p>` : ''}
          <p style="text-align: left; margin-bottom: 20px;">
            ${t.sickLeaveAsLegalRight}
          </p>
          <p style="text-align: right; margin-top: 30px;">
            ${t.sickLeaveTheDoctor}
          </p>
        </div>
      `;
    }

    const agePrefix = isFemale ? 'âgée de' : 'âgé de';

    const htmlContent = generatePrescriptionHtml({
      clinicInfo,
      doctorNameAr,
      specialtyFr,
      specialtyAr: clinicInfo?.specialtyAr,
      doctorNameFr: clinicInfo?.doctorNameFr,
      addressFr,
      phoneFixe,
      ordre,
      dateToPrint,
      assureName,
      assureAge,
      assureTypeAge,
      isFemale,
      agePrefix,
      rxHtml: bodyHtml,
      documentTitle: typeTitle, // This will be used as the main title
      docType: 'arret_travail',
      clinicHeader,
      clinicLogo,
      doctor,
      barcodeSvg,
      msgJaune,
      msgOrd
    });

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
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

  // Preset Medication Items (Fetched dynamically from most used prescribed medications or default)
  const [quickMedications, setQuickMedications] = useState([
    { name: 'Amoxicilline', forme: 'Gélule', dosage: '1g', frequency: '2 fois / jour', duration: '7 jours' },
    { name: 'Paracétamol', forme: 'Comprimé', dosage: '1g', frequency: '3 fois / jour', duration: '5 jours' },
    { name: 'Solupred', forme: 'Comprimé', dosage: '20mg', frequency: '1 fois / jour', duration: '5 jours' },
    { name: 'Oflocet Auriculaire', forme: 'Gouttes', dosage: '5 gouttes', frequency: '2 fois / jour', duration: '7 jours' },
    { name: 'Rhinoflux Spray', forme: 'Spray', dosage: '2 pulvérisations', frequency: '3 fois / jour', duration: '5 jours' },
    { name: 'Augmentin', forme: 'Sachet', dosage: '1g', frequency: '2 fois / jour', duration: '7 jours' }
  ]);

  useEffect(() => {
    fetch('/api/medications/popular')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const seen = new Set();
          const uniqueData = data.filter((item) => {
            const normKey = (item.name || '').trim().toLowerCase();
            if (!normKey || seen.has(normKey)) return false;
            seen.add(normKey);
            return true;
          });
          setQuickMedications(uniqueData.slice(0, 6));
        }
      })
      .catch(() => { });
  }, []);

  const fetchDosageSuggestionsForMed = (medId, medName, formeIdOverride, formeNameOverride) => {
    const params = new URLSearchParams();
    const targetMedId = medId !== undefined ? medId : selectedMedId;
    const targetMedName = medName !== undefined ? medName : newRxName;
    const targetFormeId = formeIdOverride !== undefined ? formeIdOverride : selectedFormeId;
    const targetFormeName = formeNameOverride !== undefined ? formeNameOverride : newRxForme;

    if (targetMedId) params.append('id', targetMedId);
    if (targetMedName && targetMedName.trim()) params.append('name', targetMedName.trim());

    if (targetFormeId) params.append('formeId', targetFormeId);
    if (targetFormeName && targetFormeName.trim()) params.append('forme', targetFormeName.trim());

    fetch(`/api/medications/dosages?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const cleaned = Array.isArray(data) ? data.filter(d => d && typeof d === 'string' && d.trim().length > 0) : [];
        if (cleaned.length > 0) {
          setDosageSuggestions(cleaned);
        } else {
          setDosageSuggestions(['1g', '500mg', '250mg', '100mg', '10mg', '5mg']);
        }
        setShowDosageDropdown(true);
      })
      .catch(() => {
        setDosageSuggestions(['1g', '500mg', '250mg', '100mg', '10mg', '5mg']);
        setShowDosageDropdown(true);
      });
  };

  const fetchFrequencySuggestionsForMed = (medId, medName) => {
    let queryParam = '';
    if (medId) queryParam = `id=${medId}`;
    else if (medName && medName.trim()) queryParam = `name=${encodeURIComponent(medName.trim())}`;

    fetch(`/api/medications/frequencies?${queryParam}`)
      .then((res) => res.json())
      .then((data) => {
        const cleaned = Array.isArray(data) ? data.filter(f => f && typeof f === 'string' && f.trim().length > 0) : [];
        if (cleaned.length > 0) {
          setFreqSuggestions(cleaned);
        } else {
          setFreqSuggestions(['1 fois / jour', '2 fois / jour', '3 fois / jour', '4 fois / jour', 'si besoin', '1 fois le matin', '1 fois le soir']);
        }
        setShowFreqDropdown(true);
      })
      .catch(() => {
        setFreqSuggestions(['1 fois / jour', '2 fois / jour', '3 fois / jour', '4 fois / jour', 'si besoin', '1 fois le matin', '1 fois le soir']);
        setShowFreqDropdown(true);
      });
  };

  const fetchDurationSuggestions = (searchQuery = '') => {
    fetch(`/api/medications/durations?q=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        const cleaned = Array.isArray(data) ? data.filter(d => d && typeof d === 'string' && d.trim().length > 0) : [];
        if (cleaned.length > 0) {
          setDurationSuggestions(cleaned);
        } else {
          setDurationSuggestions(['3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '1 mois', '3 mois']);
        }
        setShowDurationDropdown(true);
      })
      .catch(() => {
        setDurationSuggestions(['3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '1 mois', '3 mois']);
        setShowDurationDropdown(true);
      });
  };

  const fetchFreeTextSuggestions = (searchQuery = '') => {
    fetch(`/api/medications/prescriptions?q=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFreeTextSuggestions(data);
          setShowFreeTextDropdown(data.length > 0);
        } else {
          setFreeTextSuggestions([]);
          setShowFreeTextDropdown(false);
        }
      })
      .catch(() => {
        setFreeTextSuggestions([]);
        setShowFreeTextDropdown(false);
      });
  };

  const fetchFormeForMed = (medId, medName) => {
    // Disabled auto-selecting form on medication change; user selects manually from suggestions dropdown
    return;
  };

  const [dbFormeSuggestions, setDbFormeSuggestions] = useState([]);
  const fetchFormeSuggestionsFromDb = (searchQuery = '', medIdOverride = null, medNameOverride = null) => {
    let queryParam = '';
    const targetMedId = medIdOverride !== null ? medIdOverride : selectedMedId;
    const targetMedName = medNameOverride !== null ? medNameOverride : newRxName;

    if (targetMedId) {
      queryParam = `id=${targetMedId}`;
    } else if (targetMedName && targetMedName.trim()) {
      queryParam = `name=${encodeURIComponent(targetMedName.trim())}`;
    } else if (searchQuery && searchQuery.trim()) {
      queryParam = `q=${encodeURIComponent(searchQuery.trim())}`;
    }

    fetch(`/api/medications/formes${queryParam ? `?${queryParam}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const cleaned = data.filter(item => {
            if (!item) return false;
            const name = typeof item === 'object' ? item.designation : item;
            return name && typeof name === 'string' && name.trim().length > 0;
          });
          setDbFormeSuggestions(cleaned);
        }
      })
      .catch(() => { });
  };

  const resolveMedAndFormeIds = async (medName = '', formeName = '') => {
    let resolvedMed = selectedMedId;
    let resolvedForme = selectedFormeId;

    const params = new URLSearchParams();
    if (medName && medName.trim()) params.append('medication', medName.trim());
    if (formeName && formeName.trim()) params.append('forme', formeName.trim());

    if (params.toString()) {
      try {
        const res = await fetch(`/api/medications/resolve?${params.toString()}`);
        const data = await res.json();
        if (data.medId) {
          resolvedMed = data.medId;
          setSelectedMedId(data.medId);
        }
        if (data.formeId) {
          resolvedForme = data.formeId;
          setSelectedFormeId(data.formeId);
        }
      } catch (err) { }
    }

    return { medId: resolvedMed, formeId: resolvedForme };
  };

  const handleSelectMedSuggestion = (item) => {
    const mId = item.id || null;
    const mName = item.designation || '';

    setNewRxName(mName);
    setSelectedMedId(mId);
    setShowMedDropdown(false);
    setMedDbSuggestions([]);
    setFocusedSuggestionIdx(-1);

    // Reset Forme and Dosage
    setNewRxForme('');
    setSelectedFormeId(null);
    setNewRxDosage('');

    // Fetch specific form suggestions list for this selected medication
    fetchFormeSuggestionsFromDb('', mId, mName);

    // Auto-focus Form input and open assist dropdown
    setShowFormeDropdown(true);
    setTimeout(() => {
      inputFormeRef.current?.focus();
    }, 50);
  };

  const handleSelectFormeSuggestion = (item) => {
    const fId = (typeof item === 'object' && item) ? (item.id || null) : null;
    const fName = (typeof item === 'object' && item) ? (item.designation || '') : String(item || '');

    setNewRxForme(fName);
    setSelectedFormeId(fId);
    setShowFormeDropdown(false);
    setFocusedFormeIdx(-1);

    // Fetch dosage options filtered by ID_MEDICAMENT AND ID_FORME
    fetchDosageSuggestionsForMed(selectedMedId, newRxName, fId, fName);

    // Auto-focus Dose input and open assist dropdown
    setShowDosageDropdown(true);
    setTimeout(() => {
      inputDosageRef.current?.focus();
    }, 50);
  };

  const handleSelectDosageSuggestion = (dosVal) => {
    setNewRxDosage(dosVal);
    setShowDosageDropdown(false);
    setFocusedDosageIdx(-1);

    // Fetch frequency options
    fetchFrequencySuggestionsForMed(selectedMedId, newRxName);

    // Auto-focus Posologie input and open assist dropdown
    setShowFreqDropdown(true);
    setTimeout(() => {
      inputFreqRef.current?.focus();
    }, 50);
  };

  const handleSelectFrequencySuggestion = (freqVal) => {
    setNewRxFrequency(freqVal);
    setShowFreqDropdown(false);
    setFocusedFreqIdx(-1);

    // Fetch duration options
    fetchDurationSuggestions('');

    // Auto-focus Quantité/Durée input and open assist dropdown
    setShowDurationDropdown(true);
    setTimeout(() => {
      inputDurationRef.current?.focus();
    }, 50);
  };

  const syncPrescriptionsToBackend = async (rxList, customAssureInfo = null) => {
    if (!activePatient) return;
    const pId = activePatient.id || activePatient.codeBarre;
    const validRx = rxList.filter(r => r.name && r.name.trim().length > 0);
    const currentAssure = customAssureInfo || assureInfo;

    const structuredPayload = {
      activeDocType,
      prescriptionMode,
      freeTextPrescription,
      prescriptions: validRx,
      assureInfo: currentAssure,
      certificat,
      bilan,
      orientation,
      arretTravail,
      docMedical,
      nextAppointment
    };

    try {
      await fetch(`/api/patients/${pId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint: docMedical.conclusion || docMedical.title || `Consultation ${activeDocType.toUpperCase()}`,
          diagnosis: docMedical.conclusion || `Examen & Document ${activeDocType}`,
          clinicalNotes: JSON.stringify(structuredPayload),
          prescriptions: validRx,
          assureInfo: currentAssure,
          doctor,
          department,
          vitalsAtVisit: `BP: ${activePatient.vitals?.bloodPressure || '120/80'} | HR: ${activePatient.vitals?.heartRate || '72 bpm'}`
        })
      });
    } catch (err) {
      console.error('Instant prescription sync error:', err);
    }
  };
  const handleAssureInfoChange = (updated) => {
    setAssureInfo(updated);
    notifyDraftUpdate({ assureInfo: updated });
    const validRx = prescriptions.filter(r => r.name && r.name.trim().length > 0);
    if (validRx.length > 0) {
      syncPrescriptionsToBackend(prescriptions, updated);
    }
  };

  const handleAddMedicationFromForm = (preset = null) => {
    const name = preset ? preset.name : newRxName;
    const forme = preset ? (preset.forme || '') : newRxForme;
    const dosage = preset ? preset.dosage : newRxDosage;
    const frequency = preset ? (preset.frequency || '2 fois / jour') : (newRxFrequency || '2 fois / jour');
    const duration = preset ? (preset.duration || '7 jours') : (newRxDuration || '7 jours');

    if (!name || !name.trim()) return;
    const cleanName = name.trim();

    // Prevent duplicate rows: check if medication with same name already exists (case-insensitive)
    const existingIndex = prescriptions.findIndex(
      (p) => p && p.name && p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    let updatedPrescriptions;
    if (existingIndex !== -1) {
      // Update existing item's forme/dosage/frequency/duration instead of adding duplicate row
      updatedPrescriptions = [...prescriptions];
      updatedPrescriptions[existingIndex] = {
        ...updatedPrescriptions[existingIndex],
        forme: forme ? forme.trim() : updatedPrescriptions[existingIndex].forme,
        dosage: dosage ? dosage.trim() : updatedPrescriptions[existingIndex].dosage,
        frequency: frequency ? frequency.trim() : updatedPrescriptions[existingIndex].frequency,
        duration: duration ? duration.trim() : updatedPrescriptions[existingIndex].duration,
      };
    } else {
      const newItem = {
        name: cleanName,
        forme: forme ? forme.trim() : '',
        dosage: dosage ? dosage.trim() : '',
        frequency: frequency ? frequency.trim() : '',
        duration: duration ? duration.trim() : '',
        instructions: '',
        type: 1
      };
      updatedPrescriptions = [...prescriptions, newItem];
    }

    setPrescriptions(updatedPrescriptions);
    notifyDraftUpdate({ prescriptions: updatedPrescriptions });
    syncPrescriptionsToBackend(updatedPrescriptions);

    // Clear form inputs after adding & refocus Medication input
    setNewRxName('');
    setNewRxForme('');
    setSelectedFormeId(null);
    setNewRxDosage('');
    setNewRxFrequency('');
    setNewRxDuration('');
    setSelectedMedId(null);
    setTimeout(() => {
      inputMedRef.current?.focus();
    }, 50);
  };

  const handleAddPrescriptionFromForm = () => {
    if (!freeTextPrescription || !freeTextPrescription.trim()) return;

    const lines = freeTextPrescription
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const existingNames = new Set(
      prescriptions.map(p => (p && p.name ? p.name.trim().toLowerCase() : ''))
    );

    const newItems = lines
      .filter(line => !existingNames.has(line.toLowerCase()))
      .map(line => ({
        name: line,
        forme: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        type: 2
      }));

    if (newItems.length === 0) return;

    const updatedPrescriptions = [...prescriptions, ...newItems];
    setPrescriptions(updatedPrescriptions);
    notifyDraftUpdate({ prescriptions: updatedPrescriptions });
    syncPrescriptionsToBackend(updatedPrescriptions);

    // Clear free text input after adding
    setFreeTextPrescription('');
  };

  const handleAddEmptyRxRow = () => {
    const newItem = {
      name: '',
      forme: '',
      dosage: '',
      frequency: '2 fois / jour',
      duration: '7 jours',
      instructions: '',
      type: 1
    };
    const updated = [...prescriptions, newItem];
    setPrescriptions(updated);
    notifyDraftUpdate({ prescriptions: updated });
  };

  const handleAddRxRow = (preset = null) => {
    handleAddMedicationFromForm(preset);
  };

  const handleRemoveRxRow = (index) => {
    const newRx = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(newRx);
    notifyDraftUpdate({ prescriptions: newRx });
    syncPrescriptionsToBackend(newRx);
  };

  const handleRxChange = (index, field, value) => {
    const updated = [...prescriptions];
    if (!updated[index]) return;
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setPrescriptions(updated);
    notifyDraftUpdate({ prescriptions: updated });

    // Sync simultaneously to DB
    if (window._rxSyncTimer) clearTimeout(window._rxSyncTimer);
    window._rxSyncTimer = setTimeout(() => {
      syncPrescriptionsToBackend(updated);
    }, 300);
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
      prescriptionMode,
      bilanMode,
      freeTextPrescription,
      prescriptions: validRx,
      certificat,
      bilan,
      selectedBilans,
      bilanCocheRows,
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
          selectedBilans,
          bilanCocheRows,
          doctor,
          department,
          isFullSave: true,
          vitalsAtVisit: `BP: ${activePatient.vitals?.bloodPressure || '120/80'} | HR: ${activePatient.vitals?.heartRate || '72 bpm'}`
        })
      });

      if (!res.ok) {
        throw new Error(lang === 'fr' ? 'Échec de la sauvegarde de la consultation.' : 'Failed to save consultation note.');
      }

      // Explicitly update consultation status ETAT to 1 (Completed / Validated)
      try {
        await fetch('/api/consultations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idConsultation: draft?.idConsultation,
            exercice: draft?.exercice,
            patientId: pId
          })
        });
      } catch (errVal) {
        console.error('Error validating consultation ETAT:', errVal);
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
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 shrink-0">
            <Stethoscope className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              {lang === 'fr' ? 'Espace Consultation Médicale' : 'Medical Consultation Suite'}
            </h2>

            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-300">{clinicInfo?.NOM_CLINIQUE || clinicInfo?.nomCabinet || (lang === 'fr' ? 'Cabinet Médical' : 'Medical Clinic')}</span>
              <span className="text-slate-600">•</span>
              <span>{clinicInfo?.doctorNameFr || doctor || ''}</span>
            </p>

            {/* Patient Full Name, Age & Sex directly UNDER title and clinic info */}
            {activePatient && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Patient :' : 'Patient:'}</span>
                <span className="font-extrabold text-white bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {[activePatient.NOM || activePatient.nom || activePatient.lastName || activePatient.nomMalade, activePatient.PRENOM || activePatient.prenom || activePatient.firstName || activePatient.prenomMalade].filter(Boolean).join(' ') || activePatient.name || activePatient.FULLNAME || activePatient.fullname || '—'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Âge :' : 'Age:'}</span>
                <span className="font-bold text-teal-300 font-mono bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/20 shadow-sm">
                  {getPatientDisplayAge(fullPatientDetails || activePatient)}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Sexe :' : 'Sex:'}</span>
                <span className="font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/60">
                  {(activePatient.SEXE || activePatient.sexe || activePatient.gender || 'M').toString().toUpperCase().startsWith('F') ? (lang === 'fr' ? 'Féminin (F)' : 'Female (F)') : (lang === 'fr' ? 'Masculin (M)' : 'Male (M)')}
                </span>
              </div>
            )}
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
          <PatientOverviewPanel patient={fullPatientDetails || activePatient} onEditPatient={onEditPatient} onOpenNewConsultation={onOpenNewConsultation} lang={lang} clinicInfo={clinicInfo} />
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
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${isSelected
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

            {/* SHARED ASSURÉ INFORMATION PANEL FOR ALL CONSULTATION SECTIONS */}
            <div className="p-3.5 rounded-2xl border border-teal-500/30 bg-slate-950/80 space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                    <UserCheck className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {lang === 'fr' ? 'Informations de l\'Assuré' : 'Insured Person Information'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {assureInfo.sexe === 'F' ? (lang === 'fr' ? 'Féminin' : 'Female') : (lang === 'fr' ? 'Masculin' : 'Male')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-3">
                      <span>
                        <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Nom complet :' : 'Full Name:'}</strong>{' '}
                        <span className="font-semibold text-white">{assureInfo.fullname || '—'}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Âge :' : 'Age:'}</strong>{' '}
                        <span className="font-semibold text-teal-300">{assureInfo.age || '—'} {assureInfo.typeAge || 'ans'}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Sexe :' : 'Sex:'}</strong>{' '}
                        <span className="font-semibold text-cyan-300">{assureInfo.sexe || 'M'}</span>
                      </span>
                      {assureInfo.infoSupp && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>
                            <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Info Supp :' : 'Add. Info:'}</strong>{' '}
                            <span className="font-semibold text-amber-300">{assureInfo.infoSupp}</span>
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInfoSupp(!showInfoSupp)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${showInfoSupp || (assureInfo.infoSupp && assureInfo.infoSupp.trim())
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    title={lang === 'fr' ? 'Afficher/Masquer l\'Information Supplémentaire' : 'Toggle Additional Information'}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'fr' ? 'Info Supp.' : 'Add. Info'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAssurePanel(!showAssurePanel)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{showAssurePanel ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? 'Modifier l\'Assuré' : 'Edit Insured Details')}</span>
                  </button>
                </div>
              </div>

              {(showAssurePanel || showInfoSupp) && (
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
                  {/* 1. Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      {lang === 'fr' ? 'Nom & Prénom (Full Name)' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={assureInfo.fullname || ''}
                      onChange={(e) => handleAssureInfoChange({ ...assureInfo, fullname: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition"
                      placeholder={lang === 'fr' ? 'Nom et prénom de l\'assuré...' : 'Full name...'}
                    />
                  </div>

                  {/* 2. Age & Type d'âge */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        {lang === 'fr' ? 'Âge' : 'Age'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={assureInfo.age || ''}
                        onChange={(e) => handleAssureInfoChange({ ...assureInfo, age: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-teal-300 font-semibold focus:outline-none focus:border-teal-500 transition"
                        placeholder={lang === 'fr' ? 'ex: 30' : 'e.g. 30'}
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        {lang === 'fr' ? 'Unité' : 'Unit'}
                      </label>
                      <select
                        value={assureInfo.typeAge || 'ans'}
                        onChange={(e) => handleAssureInfoChange({ ...assureInfo, typeAge: e.target.value })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition"
                      >
                        <option value="ans">{lang === 'fr' ? 'Ans' : 'Years'}</option>
                        <option value="mois">{lang === 'fr' ? 'Mois' : 'Months'}</option>
                        <option value="jours">{lang === 'fr' ? 'Jours' : 'Days'}</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Sexe */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      {lang === 'fr' ? 'Sexe' : 'Sex'}
                    </label>
                    <select
                      value={assureInfo.sexe || 'M'}
                      onChange={(e) => handleAssureInfoChange({ ...assureInfo, sexe: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition"
                    >
                      <option value="M">{lang === 'fr' ? 'Masculin' : 'Male'}</option>
                      <option value="F">{lang === 'fr' ? 'Féminin' : 'Female'}</option>
                    </select>
                  </div>

                  {/* 4. Information Supplémentaire (INFO_SUP) */}
                  <div className="col-span-full pt-2 border-t border-slate-800/60">
                    <label className="block text-[10px] font-bold text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-amber-400" />
                      {lang === 'fr' ? 'Information Supplémentaire (INFO_SUP)' : 'Additional Information'}
                    </label>
                    <input
                      type="text"
                      value={assureInfo.infoSupp || ''}
                      onChange={(e) => handleAssureInfoChange({ ...assureInfo, infoSupp: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600 font-mono"
                      placeholder={lang === 'fr' ? 'Saisir une information supplémentaire...' : 'Enter additional information...'}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 1. DYNAMIC PANEL: ORDONNANCE (Prescription Builder) */}
            {activeDocType === 'ordonnance' && (
              <div className="space-y-4">

                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  {/* Left: Section Title */}
                  <div className="shrink-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-400" />
                      {lang === 'fr' ? 'Rédaction de l\'Ordonnance Médicale' : 'Prescription Builder'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Impression & historique des ordonnances :' : 'Print & prescription history:'}
                    </p>
                  </div>

                  {/* Center: The Two Action Buttons */}
                  <div className="flex items-center justify-center gap-2.5 mx-auto">
                    <button
                      type="button"
                      onClick={handleOpenPastPrescriptions}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold rounded-xl border border-slate-800 hover:border-cyan-500/40 transition flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                      title={lang === 'fr' ? 'Afficher la liste des anciennes ordonnances' : 'Show previous prescriptions list'}
                    >
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === 'fr' ? 'Anciennes Ordonnances' : 'Past Prescriptions'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintPrescription}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl border border-emerald-400/40 shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      title={lang === 'fr' ? 'Imprimer l\'ordonnance médicale' : 'Print medical prescription'}
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-100" />
                      <span>{lang === 'fr' ? 'Imprimer' : 'Print'}</span>
                    </button>
                  </div>

                  {/* Right: Radio / Mode Toggle Selector */}
                  <div className="shrink-0">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptionMode('medicaments');
                          notifyDraftUpdate({ prescriptionMode: 'medicaments' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${prescriptionMode === 'medicaments'
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                      >
                        <Pill className="w-3.5 h-3.5" />
                        <span>Médicaments</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptionMode('prescription');
                          notifyDraftUpdate({ prescriptionMode: 'prescription' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${prescriptionMode === 'prescription'
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Préscription</span>
                      </button>
                    </div>
                  </div>
                </div>

                {prescriptionMode === 'medicaments' ? (
                  <>
                    {/* Fast Prescription Favorites */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {lang === 'fr' ? 'Favoris Rapides (Les Plus Utilisés) :' : 'Most Used Quick Presets:'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Map(quickMedications.map(p => [(p.name || '').trim().toLowerCase(), p])).values()).slice(0, 6).map((preset, idx) => {
                          const isAlreadyInRx = prescriptions.some(
                            (p) => p && p.name && p.name.trim().toLowerCase() === (preset.name || '').trim().toLowerCase()
                          );

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddMedicationFromForm(preset)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition shadow-sm group ${isAlreadyInRx
                                  ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-500/60 font-semibold shadow-emerald-500/10'
                                  : 'bg-slate-950 hover:bg-slate-800 text-teal-300 border border-slate-800 hover:border-teal-500/50'
                                }`}
                              title={
                                isAlreadyInRx
                                  ? `${preset.name} est déjà présent dans la liste. Cliquer pour mettre à jour.`
                                  : `Ajouter ${preset.name} - Forme: ${preset.forme || '-'} - Dosage: ${preset.dosage || '-'} - Posologie: ${preset.frequency || '-'} - Durée: ${preset.duration || '-'}`
                              }
                            >
                              {isAlreadyInRx ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-teal-400 shrink-0 group-hover:scale-110 transition" />
                              )}
                              <span className="font-bold text-slate-100">{preset.name}</span>
                              {preset.forme && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${isAlreadyInRx
                                    ? 'text-emerald-300 bg-emerald-950 border-emerald-800/80'
                                    : 'text-cyan-300 bg-cyan-950/80 border-cyan-800/60'
                                  }`}>
                                  {preset.forme}
                                </span>
                              )}
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${isAlreadyInRx
                                  ? 'text-emerald-300 bg-emerald-950 border-emerald-800/80'
                                  : 'text-teal-300 bg-teal-950/80 border-teal-800/60'
                                }`}>
                                {preset.frequency || '2x/j'} • {preset.duration || '7j'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Single Line Form Entry for Medication */}
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{lang === 'fr' ? 'Saisir un Médicament :' : 'Add Medication Form:'}</span>
                        <span className="text-[10px] text-teal-400 font-medium">
                          {lang === 'fr' ? 'Saisir les informations puis cliquer sur Ajouter' : 'Fill fields then click Add'}
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-end">
                        {/* 1. Médicament Input */}
                        <div className="col-span-12 sm:col-span-3 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Médicament' : 'Medication'}
                          </label>
                          <input
                            ref={inputMedRef}
                            type="text"
                            placeholder={t.exAmoxicilline || (lang === 'fr' ? 'ex: Amoxicilline' : 'e.g. Amoxicillin')}
                            value={newRxName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewRxName(val);
                              setShowMedDropdown(true);
                              if (!val || !val.trim()) {
                                setSelectedMedId(null);
                                setSelectedFormeId(null);
                                setDbFormeSuggestions([]);
                              }
                            }}
                            onFocus={() => {
                              setShowMedDropdown(true);
                              fetchMedSuggestionsFromDb(newRxName);
                            }}
                            onBlur={() => {
                              setTimeout(async () => {
                                setShowMedDropdown(false);
                                if (!newRxName || !newRxName.trim()) {
                                  setSelectedMedId(null);
                                  setSelectedFormeId(null);
                                  setDbFormeSuggestions([]);
                                } else {
                                  const match = medDbSuggestions.find(
                                    (s) => s.designation && s.designation.trim().toLowerCase() === newRxName.trim().toLowerCase()
                                  );
                                  if (match && match.id) {
                                    setSelectedMedId(match.id);
                                    fetchFormeSuggestionsFromDb('', match.id, newRxName);
                                  } else {
                                    const { medId } = await resolveMedAndFormeIds(newRxName, '');
                                    fetchFormeSuggestionsFromDb('', medId, newRxName);
                                  }
                                }
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setFocusedSuggestionIdx((prev) => Math.min(prev + 1, medDbSuggestions.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setFocusedSuggestionIdx((prev) => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (showMedDropdown && focusedSuggestionIdx >= 0 && medDbSuggestions[focusedSuggestionIdx]) {
                                  handleSelectMedSuggestion(medDbSuggestions[focusedSuggestionIdx]);
                                } else if (newRxName.trim()) {
                                  setShowMedDropdown(false);
                                  setShowFormeDropdown(true);
                                  fetchFormeSuggestionsFromDb('', selectedMedId, newRxName);
                                  setTimeout(() => inputFormeRef.current?.focus(), 50);
                                }
                              } else if (e.key === 'Escape') {
                                setShowMedDropdown(false);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />

                          {/* DB Autocomplete Suggestions Dropdown (medicament.DESIGNATION) */}
                          {showMedDropdown && medDbSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                              {Array.from(
                                new Map(medDbSuggestions.map(item => [item.designation.trim().toLowerCase(), item])).values()
                              ).map((item, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectMedSuggestion(item);
                                  }}
                                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition ${focusedSuggestionIdx === idx
                                      ? 'bg-teal-500 text-slate-950 font-bold'
                                      : 'text-slate-200 hover:bg-slate-800 hover:text-teal-300'
                                    }`}
                                >
                                  <span className="font-semibold">{item.designation}</span>
                                  {(item.forme || item.dosage || item.frequency) && (
                                    <span className={`text-[10px] font-mono ${focusedSuggestionIdx === idx ? 'text-slate-900' : 'text-slate-400'}`}>
                                      {[item.forme, item.dosage, item.frequency].filter(Boolean).join(' • ')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. Forme Input */}
                        <div className="col-span-6 sm:col-span-2 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Forme' : 'Form'}
                          </label>
                          <input
                            ref={inputFormeRef}
                            type="text"
                            placeholder={t.exGelule || (lang === 'fr' ? 'ex: Gélule' : 'e.g. Capsule')}
                            value={newRxForme}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewRxForme(val);
                              setShowFormeDropdown(true);
                              if (!val || !val.trim()) {
                                setSelectedFormeId(null);
                              }
                              fetchFormeSuggestionsFromDb(val);
                            }}
                            onFocus={() => {
                              setShowFormeDropdown(true);
                              fetchFormeSuggestionsFromDb(newRxForme);
                            }}
                            onBlur={() => {
                              setTimeout(async () => {
                                setShowFormeDropdown(false);
                                if (!newRxForme || !newRxForme.trim()) {
                                  setSelectedFormeId(null);
                                  fetchDosageSuggestionsForMed(selectedMedId, newRxName, null, '');
                                } else {
                                  const match = dbFormeSuggestions.find(
                                    (f) => typeof f === 'object' && f && f.designation && f.designation.trim().toLowerCase() === newRxForme.trim().toLowerCase()
                                  );
                                  if (match && match.id) {
                                    setSelectedFormeId(match.id);
                                    fetchDosageSuggestionsForMed(selectedMedId, newRxName, match.id, newRxForme);
                                  } else {
                                    const { formeId } = await resolveMedAndFormeIds('', newRxForme);
                                    fetchDosageSuggestionsForMed(selectedMedId, newRxName, formeId, newRxForme);
                                  }
                                }
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              const rawFormes = (dbFormeSuggestions && dbFormeSuggestions.length > 0)
                                ? dbFormeSuggestions
                                : formeOptions.map(f => ({ id: null, designation: f }));
                              const filteredFormes = rawFormes.filter(f => {
                                const name = typeof f === 'object' && f ? f.designation : f;
                                return name && typeof name === 'string' && name.trim().length > 0 && (!newRxForme.trim() || name.toLowerCase().includes(newRxForme.trim().toLowerCase()));
                              });

                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setFocusedFormeIdx((prev) => Math.min(prev + 1, filteredFormes.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setFocusedFormeIdx((prev) => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (showFormeDropdown && focusedFormeIdx >= 0 && filteredFormes[focusedFormeIdx]) {
                                  handleSelectFormeSuggestion(filteredFormes[focusedFormeIdx]);
                                } else {
                                  handleSelectFormeSuggestion(newRxForme);
                                }
                              } else if (e.key === 'Escape') {
                                setShowFormeDropdown(false);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />

                          {showFormeDropdown && (() => {
                            const rawFormes = (dbFormeSuggestions && dbFormeSuggestions.length > 0)
                              ? dbFormeSuggestions
                              : formeOptions.map(f => ({ id: null, designation: f }));
                            const filteredFormes = rawFormes.filter(f => {
                              const name = typeof f === 'object' && f ? f.designation : f;
                              return name && typeof name === 'string' && name.trim().length > 0 && (!newRxForme.trim() || name.toLowerCase().includes(newRxForme.trim().toLowerCase()));
                            });

                            if (filteredFormes.length === 0) return null;

                            return (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                                {filteredFormes.map((f, idx) => {
                                  const fName = typeof f === 'object' ? f.designation : f;
                                  return (
                                    <div
                                      key={idx}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectFormeSuggestion(f);
                                      }}
                                      className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition ${focusedFormeIdx === idx
                                          ? 'bg-teal-500 text-slate-950 font-bold'
                                          : 'text-slate-200 hover:bg-slate-800 hover:text-teal-300'
                                        }`}
                                    >
                                      <span className="font-medium">{fName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        {/* 3. Dosage Input */}
                        <div className="col-span-6 sm:col-span-2 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Dosage' : 'Dosage'}
                          </label>
                          <input
                            ref={inputDosageRef}
                            type="text"
                            placeholder={t.ex1g || (lang === 'fr' ? 'ex: 1g' : 'e.g. 1g')}
                            value={newRxDosage}
                            onChange={(e) => {
                              setNewRxDosage(e.target.value);
                              setShowDosageDropdown(true);
                            }}
                            onFocus={async () => {
                              setShowDosageDropdown(true);
                              let mId = newRxName && newRxName.trim() ? selectedMedId : null;
                              let fId = newRxForme && newRxForme.trim() ? selectedFormeId : null;

                              if (!newRxName || !newRxName.trim()) setSelectedMedId(null);
                              if (!newRxForme || !newRxForme.trim()) setSelectedFormeId(null);

                              if ((newRxName && newRxName.trim() && !mId) || (newRxForme && newRxForme.trim() && !fId)) {
                                const resolved = await resolveMedAndFormeIds(
                                  (!mId && newRxName.trim()) ? newRxName : '',
                                  (!fId && newRxForme.trim()) ? newRxForme : ''
                                );
                                if (resolved.medId) mId = resolved.medId;
                                if (resolved.formeId) fId = resolved.formeId;
                              }

                              fetchDosageSuggestionsForMed(mId, newRxName, fId, newRxForme);
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowDosageDropdown(false), 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setFocusedDosageIdx((prev) => Math.min(prev + 1, dosageSuggestions.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setFocusedDosageIdx((prev) => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (showDosageDropdown && focusedDosageIdx >= 0 && dosageSuggestions[focusedDosageIdx]) {
                                  handleSelectDosageSuggestion(dosageSuggestions[focusedDosageIdx]);
                                } else {
                                  handleSelectDosageSuggestion(newRxDosage);
                                }
                              } else if (e.key === 'Escape') {
                                setShowDosageDropdown(false);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />

                          {/* Dosage DB Autocomplete Dropdown */}
                          {showDosageDropdown && dosageSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                              {dosageSuggestions.map((dos, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectDosageSuggestion(dos);
                                  }}
                                  className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition ${focusedDosageIdx === idx
                                      ? 'bg-teal-500 text-slate-950 font-bold'
                                      : 'text-slate-200 hover:bg-slate-800 hover:text-teal-300'
                                    }`}
                                >
                                  <span className="font-medium">{dos}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4. Posologie Input */}
                        <div className="col-span-6 sm:col-span-2 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Posologie' : 'Posology'}
                          </label>
                          <input
                            ref={inputFreqRef}
                            type="text"
                            placeholder={t.ex2TimesDay || (lang === 'fr' ? 'ex: 2 fois / jour' : 'e.g. Twice daily')}
                            value={newRxFrequency}
                            onChange={(e) => {
                              setNewRxFrequency(e.target.value);
                              setShowFreqDropdown(true);
                            }}
                            onFocus={() => {
                              setShowFreqDropdown(true);
                              fetchFrequencySuggestionsForMed(selectedMedId, newRxName);
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowFreqDropdown(false), 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setFocusedFreqIdx((prev) => Math.min(prev + 1, freqSuggestions.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setFocusedFreqIdx((prev) => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (showFreqDropdown && focusedFreqIdx >= 0 && freqSuggestions[focusedFreqIdx]) {
                                  handleSelectFrequencySuggestion(freqSuggestions[focusedFreqIdx]);
                                } else {
                                  handleSelectFrequencySuggestion(newRxFrequency);
                                }
                              } else if (e.key === 'Escape') {
                                setShowFreqDropdown(false);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />

                          {/* Posologie DB Autocomplete Dropdown */}
                          {showFreqDropdown && freqSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                              {freqSuggestions.map((freq, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectFrequencySuggestion(freq);
                                  }}
                                  className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition ${focusedFreqIdx === idx
                                      ? 'bg-teal-500 text-slate-950 font-bold'
                                      : 'text-slate-200 hover:bg-slate-800 hover:text-teal-300'
                                    }`}
                                >
                                  <span className="font-medium">{freq}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 5. Quantité / Durée Input */}
                        <div className="col-span-6 sm:col-span-2 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            {lang === 'fr' ? 'Quantité / Durée' : 'Qty / Duration'}
                          </label>
                          <input
                            ref={inputDurationRef}
                            type="text"
                            placeholder={t.ex7Days || (lang === 'fr' ? 'ex: 7 jours' : 'e.g. 7 days')}
                            value={newRxDuration}
                            onChange={(e) => {
                              setNewRxDuration(e.target.value);
                              setShowDurationDropdown(true);
                              fetchDurationSuggestions(e.target.value);
                            }}
                            onFocus={() => {
                              setShowDurationDropdown(true);
                              fetchDurationSuggestions(newRxDuration);
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowDurationDropdown(false), 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setFocusedDurationIdx((prev) => Math.min(prev + 1, durationSuggestions.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setFocusedDurationIdx((prev) => Math.max(prev - 1, 0));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (showDurationDropdown && focusedDurationIdx >= 0 && durationSuggestions[focusedDurationIdx]) {
                                  setNewRxDuration(durationSuggestions[focusedDurationIdx]);
                                  setShowDurationDropdown(false);
                                }
                                handleAddMedicationFromForm();
                              } else if (e.key === 'Escape') {
                                setShowDurationDropdown(false);
                              }
                            }}
                            className="w-full px-2.5 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />

                          {/* Durée DB Autocomplete Dropdown */}
                          {showDurationDropdown && durationSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                              {durationSuggestions.map((dur, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setNewRxDuration(dur);
                                    setShowDurationDropdown(false);
                                  }}
                                  className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition ${focusedDurationIdx === idx
                                      ? 'bg-teal-500 text-slate-950 font-bold'
                                      : 'text-slate-200 hover:bg-slate-800 hover:text-teal-300'
                                    }`}
                                >
                                  <span className="font-medium">{dur}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 6. Button: Ajouter Médicament */}
                        <div className="col-span-12 sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleAddMedicationFromForm()}
                            disabled={!newRxName.trim()}
                            className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border shadow-sm ${newRxName.trim()
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 border-teal-400 hover:from-teal-400 hover:to-cyan-400 shadow-teal-500/20'
                                : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                              }`}
                            title={lang === 'fr' ? 'Ajouter ce médicament' : 'Add Drug'}
                          >
                            <Plus className="w-4 h-4 shrink-0" />
                            <span className="truncate">{lang === 'fr' ? 'Ajouter' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Mode Préscription (Saisie Libre de la Prescription) */
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{lang === 'fr' ? 'Saisie Libre de la Prescription :' : 'Freeform Prescription Entry:'}</span>
                      <span className="text-[10px] text-teal-400 font-medium bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                        {lang === 'fr' ? 'Mode Saisie Libre' : 'Free Text Mode'}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-10 relative">
                        <textarea
                          rows={2}
                          value={freeTextPrescription}
                          onChange={(e) => {
                            setFreeTextPrescription(e.target.value);
                            setShowFreeTextDropdown(true);
                            fetchFreeTextSuggestions(e.target.value);
                            notifyDraftUpdate({ freeTextPrescription: e.target.value });
                          }}
                          onFocus={() => {
                            fetchFreeTextSuggestions(freeTextPrescription);
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowFreeTextDropdown(false), 200);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              if (showFreeTextDropdown && focusedFreeTextIdx >= 0 && freeTextSuggestions[focusedFreeTextIdx]) {
                                e.preventDefault();
                                setFreeTextPrescription(freeTextSuggestions[focusedFreeTextIdx]);
                                setShowFreeTextDropdown(false);
                              } else {
                                e.preventDefault();
                                handleAddPrescriptionFromForm();
                              }
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setFocusedFreeTextIdx((prev) => Math.min(prev + 1, freeTextSuggestions.length - 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setFocusedFreeTextIdx((prev) => Math.max(prev - 1, 0));
                            } else if (e.key === 'Escape') {
                              setShowFreeTextDropdown(false);
                            }
                          }}
                          placeholder={
                            lang === 'fr'
                              ? "Saisir une prescription médicale complète (ex: Amoxicilline 1g : 1 gélule 2 fois par jour pendant 7 jours)..."
                              : "Type custom prescription line..."
                          }
                          className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:border-teal-500 outline-none leading-relaxed"
                        />

                        {/* Freeform Prescription DB Autocomplete Dropdown (medicament_p.PRESCRIPTION) */}
                        {showFreeTextDropdown && freeTextSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-teal-500/50 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-800/80">
                            {freeTextSuggestions.map((pText, idx) => (
                              <div
                                key={idx}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFreeTextPrescription(pText);
                                  setShowFreeTextDropdown(false);
                                }}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition ${focusedFreeTextIdx === idx
                                    ? 'bg-teal-500 text-slate-950 font-bold'
                                    : 'text-slate-200 hover:bg-slate-800 hover:text-teal-300'
                                  }`}
                              >
                                <span className="font-medium">{pText}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Button ON THE SAME LINE with form input: Ajouter Prescription */}
                      <div className="col-span-12 md:col-span-2">
                        <button
                          type="button"
                          onClick={() => handleAddPrescriptionFromForm()}
                          disabled={!freeTextPrescription.trim()}
                          className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border shadow-sm ${freeTextPrescription.trim()
                              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 border-teal-400 hover:from-teal-400 hover:to-cyan-400 shadow-teal-500/20'
                              : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                            }`}
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span className="truncate">{lang === 'fr' ? 'Ajouter Prescription' : 'Add Prescription'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shared Prescriptions & Medications List Table (For Both Médicaments & Préscription Modes) */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-cyan-400" />
                      {lang === 'fr' ? 'Liste des Médicaments & Prescriptions' : 'Prescribed Rx & Dosage Table'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {`${prescriptions.filter(r => r && r.name && r.name.trim()).length} ${lang === 'fr' ? 'élément(s)' : 'item(s)'}`}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">{lang === 'fr' ? 'Médicament' : 'Medication'}</th>
                          <th className="py-2.5 px-3">{lang === 'fr' ? 'Forme' : 'Form'}</th>
                          <th className="py-2.5 px-3">{lang === 'fr' ? 'Dosage' : 'Dosage'}</th>
                          <th className="py-2.5 px-3">{lang === 'fr' ? 'Posologie' : 'Posology'}</th>
                          <th className="py-2.5 px-3">{lang === 'fr' ? 'Quantité / Durée' : 'Duration'}</th>
                          <th className="py-2.5 px-3 text-right">{lang === 'fr' ? 'Action' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {prescriptions.length > 0 ? (
                          prescriptions.map((rx, realIdx) => (
                            <tr key={realIdx} className="hover:bg-slate-900/50 transition group">
                              {rx.type === 2 ? (
                                <td colSpan={5} className="py-2 px-3 font-semibold text-cyan-300 bg-cyan-950/20">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60 font-bold shrink-0">
                                      {lang === 'fr' ? 'Prescription' : 'Custom Rx'}
                                    </span>
                                    <input
                                      type="text"
                                      value={rx.name || ''}
                                      onChange={(e) => handleRxChange(realIdx, 'name', e.target.value)}
                                      placeholder={lang === 'fr' ? 'Saisir la prescription...' : 'Type rx line...'}
                                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500 rounded px-2 py-1 text-xs text-cyan-200 outline-none"
                                    />
                                  </div>
                                </td>
                              ) : (
                                <>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={rx.name || ''}
                                      onChange={(e) => handleRxChange(realIdx, 'name', e.target.value)}
                                      placeholder={lang === 'fr' ? 'Nom du médicament...' : 'Medication name...'}
                                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 rounded px-2 py-1 text-xs font-semibold text-teal-300 outline-none"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={rx.forme || ''}
                                      onChange={(e) => handleRxChange(realIdx, 'forme', e.target.value)}
                                      placeholder={t.exGelule || (lang === 'fr' ? 'ex: Gélule' : 'e.g. Capsule')}
                                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={rx.dosage || ''}
                                      onChange={(e) => handleRxChange(realIdx, 'dosage', e.target.value)}
                                      placeholder={t.ex1g || (lang === 'fr' ? 'ex: 1g' : 'e.g. 1g')}
                                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 rounded px-2 py-1 text-xs font-mono text-slate-200 outline-none"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={rx.frequency || ''}
                                      onChange={(e) => handleRxChange(realIdx, 'frequency', e.target.value)}
                                      placeholder={t.ex2TimesDay || (lang === 'fr' ? 'ex: 2 fois / jour' : 'e.g. Twice daily')}
                                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 rounded px-2 py-1 text-xs text-slate-300 outline-none"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={rx.duration || ''}
                                      onChange={(e) => handleRxChange(realIdx, 'duration', e.target.value)}
                                      placeholder={t.ex7Days || (lang === 'fr' ? 'ex: 7 jours' : 'e.g. 7 days')}
                                      className="w-full bg-slate-900/80 border border-slate-800 focus:border-teal-500 rounded px-2 py-1 text-xs font-mono text-cyan-400 outline-none"
                                    />
                                  </td>
                                </>
                              )}
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRxRow(realIdx)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                  title={lang === 'fr' ? 'Supprimer du tableau' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-4 px-3 text-center text-slate-500 italic text-xs">
                              {lang === 'fr'
                                ? 'Aucun élément dans la liste. Remplissez le formulaire ci-dessus puis cliquez sur Ajouter.'
                                : 'No items added yet. Fill out the form above then click Add.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                      <option value="Certificat Médical Descriptif">{lang === 'fr' ? 'Certificat Médical Descriptif' : 'Descriptive Medical Certificate'}</option>
                      <option value="Certificat de Bonne Santé & Aptitude">{lang === 'fr' ? 'Certificat de Bonne Santé & Aptitude' : 'Health & Medical Fitness Certificate'}</option>
                      <option value="Certificat de Non-Contre-Indication Sportive">{lang === 'fr' ? 'Certificat de Non-Contre-Indication Sportive' : 'Sports Clearance Certificate'}</option>
                      <option value="Certificat de Présence & Consultation">{lang === 'fr' ? 'Certificat de Présence & Consultation' : 'Attendance & Consultation Certificate'}</option>
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  {/* Left: Section Title */}
                  <div className="shrink-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-cyan-400" />
                      {lang === 'fr' ? 'Demande de Bilan Biologique & Imagerie' : 'Biological & Radiology Order'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Sélectionner ou saisir la demande de bilan :' : 'Select or write lab/radiology request:'}
                    </p>
                  </div>

                  {/* Right: Mode Toggle Selector (Sélection / Saisie) */}
                  <div className="shrink-0">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setBilanMode('selection');
                          notifyDraftUpdate({ bilanMode: 'selection' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${bilanMode === 'selection'
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Sélection</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBilanMode('saisie');
                          notifyDraftUpdate({ bilanMode: 'saisie' });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${bilanMode === 'saisie'
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Saisie</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top Controls according to Mode (Sélection / Saisie) */}
                {bilanMode === 'selection' ? (
                  /* Mode Sélection: Button 'Ajouter' */
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleOpenBilanAddOrEdit}
                      className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-bold rounded-xl border border-teal-400 hover:from-teal-400 hover:to-cyan-400 shadow-md shadow-teal-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'fr' ? 'Ajouter / Modifier le Bilan' : 'Add / Edit Bilan'}</span>
                    </button>
                  </div>
                ) : (
                  /* Mode Saisie Libre (Free Text Area with ADD button) */
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{lang === 'fr' ? 'Saisir la Demande de Bilan :' : 'Enter Bilan Request:'}</span>
                      <span className="text-[10px] text-teal-400 font-medium bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                        {lang === 'fr' ? 'Mode Saisie Libre' : 'Free Text Mode'}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={bilan.freeText || ''}
                      onChange={(e) => {
                        const newBilan = { ...bilan, freeText: e.target.value };
                        setBilan(newBilan);
                        notifyDraftUpdate({ bilan: newBilan });
                        if (saisieError) setSaisieError('');
                      }}
                      placeholder={lang === 'fr' ? 'Saisir le détail du bilan biologique ou imagerie demandé...' : 'Enter lab or imaging request details...'}
                      className={`w-full p-3 bg-slate-900 border rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono leading-relaxed transition ${saisieError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-teal-500'
                        }`}
                    />

                    {saisieError && (
                      <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{saisieError}</span>
                      </p>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddFreeTextBilan}
                        disabled={!bilan.freeText || !bilan.freeText.trim()}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95 ${(!bilan.freeText || !bilan.freeText.trim())
                            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 border border-teal-400 hover:from-teal-400 hover:to-cyan-400 shadow-teal-500/20'
                          }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'fr' ? 'Ajouter au Bilan' : 'Add to Bilan'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Common Bilan History Table (loads from bilan_consult_coche & bilans_consult left join bilan) */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span>{lang === 'fr' ? 'Historique des Bilans (bilan_consult_coche & bilans_consult)' : 'Bilan History (bilan_consult_coche & bilans_consult)'}</span>
                    {loadingBilanCoche && <span className="text-teal-400 font-normal animate-pulse text-[11px]">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-inner max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px]">
                          <th className="py-2.5 px-3 w-28">{lang === 'fr' ? 'Date Bilan' : 'Bilan Date'}</th>
                          <th className="py-2.5 px-3">{lang === 'fr' ? 'Désignation (Examens Cochés / Saisis)' : 'Designation (Checked / Custom Tests)'}</th>
                          <th className="py-2.5 px-3 text-right w-16">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {bilanCocheRows.length > 0 ? (
                          bilanCocheRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50 transition">
                              <td className="py-2.5 px-3 font-mono text-teal-400 whitespace-nowrap align-top">
                                {row.DATE_BILAN ? new Date(row.DATE_BILAN).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {row.DESIGNATION ? row.DESIGNATION.trim() : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right align-top flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePrintBilan(row)}
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                  title={lang === 'fr' ? 'Imprimer ce bilan' : 'Print this bilan'}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBilanIndex(idx);
                                    setSelectedBilans(parseDesignationToSelected(row.DESIGNATION));
                                    setShowBilanModal(true);
                                  }}
                                  className="p-1.5 text-teal-400 hover:text-teal-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                  title={lang === 'fr' ? 'Modifier ce bilan' : 'Edit this bilan'}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteBilan(row)}
                                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                  title={lang === 'fr' ? 'Supprimer de la liste' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-4 px-3 text-center text-slate-500 italic">
                              {loadingBilanCoche
                                ? (lang === 'fr' ? 'Chargement des données du bilan...' : 'Loading bilan data...')
                                : (lang === 'fr' ? 'Aucun bilan enregistré pour ce patient.' : 'No recorded bilans for this patient.')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                      <option value="Cardiologie">{lang === 'fr' ? 'Cardiologie' : 'Cardiology'}</option>
                      <option value="Neurologie">{lang === 'fr' ? 'Neurologie' : 'Neurology'}</option>
                      <option value="Chirurgie Maxillo-Faciale">{lang === 'fr' ? 'Chirurgie Maxillo-Faciale' : 'Maxillofacial Surgery'}</option>
                      <option value="Pneumologie">{lang === 'fr' ? 'Pneumologie' : 'Pulmonology'}</option>
                      <option value="Endocrinologie">{lang === 'fr' ? 'Endocrinologie' : 'Endocrinology'}</option>
                      <option value="Pédiatrie">{lang === 'fr' ? 'Pédiatrie' : 'Pediatrics'}</option>
                      <option value="Radiologie / Imagerie">{lang === 'fr' ? 'Radiologie / Imagerie' : 'Radiology / Imaging'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Établissement / Structure' : 'Hospital / Clinic'}
                    </label>
                    <input
                      type="text"
                      placeholder={t.exHospital || (lang === 'fr' ? 'ex: CHU Mustapha Pacha' : 'e.g. City Central Hospital')}
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
                    {lang === 'fr' ? "Motif d'Orientation & Synthèse Clinique" : "Reason for Referral"}
                  </label>
                  <textarea
                    rows="6"
                    value={orientation.reason}
                    onChange={(e) => {
                      const newO = { ...orientation, reason: e.target.value };
                      setOrientation(newO);
                      notifyDraftUpdate({ orientation: newO });
                    }}
                    placeholder={lang === 'fr' ? "Motif d'orientation, observations et synthèse clinique..." : "Reason for referral, observations and clinical summary..."}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none"
                  ></textarea>
                </div>
              </div>
            )}

            {/* 5. DYNAMIC PANEL: ARRÊT DE TRAVAIL (Sick Leave) */}
            {activeDocType === 'arret_travail' && (
              <div className="space-y-5">
                {/* Top Header & Type Selector */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarOff className="w-4 h-4 text-rose-400" />
                      {lang === 'fr' ? 'Certificat d\'Arrêt de Travail' : 'Work Disability / Sick Leave'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Prescription de repos médical, prolongation ou reprise' : 'Prescribe sick leave days and return date'}
                    </p>
                  </div>

                  {/* Mode Selector for Arrêt de Travail */}
                  <div className="shrink-0">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newAT = { ...arretTravail, type: 'arret' };
                          setArretTravail(newAT);
                          notifyDraftUpdate({ arretTravail: newAT });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          (arretTravail.type || 'arret') === 'arret'
                            ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20 scale-[1.02]'
                            : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40'
                        }`}
                      >
                        <CalendarOff className="w-3.5 h-3.5" />
                        <span>{lang === 'fr' ? 'Arrêt de Travail' : 'Sick Leave'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newAT = { ...arretTravail, type: 'prolongation' };
                          setArretTravail(newAT);
                          notifyDraftUpdate({ arretTravail: newAT });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          arretTravail.type === 'prolongation'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                            : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{lang === 'fr' ? 'Prolongation' : 'Extension'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newAT = { ...arretTravail, type: 'reprise' };
                          setArretTravail(newAT);
                          notifyDraftUpdate({ arretTravail: newAT });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          arretTravail.type === 'reprise'
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                            : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'fr' ? 'Reprise de Travail' : 'Return to Work'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Line 1: Days input + Days in letters input (Hidden when type is reprise) */}
                {arretTravail.type !== 'reprise' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        {lang === 'fr' ? 'Nombre de Jours' : 'Number of Days'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={arretTravail.days}
                        onFocus={(e) => e.target.select()}
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
                        {lang === 'fr' ? 'Nombre de Jours (en Lettres)' : 'Days (in Words)'}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={numberToWords(arretTravail.days, lang)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-900/80 text-rose-300 font-extrabold border border-slate-800 rounded-xl cursor-not-allowed uppercase tracking-wide"
                      />
                    </div>
                  </div>
                )}

                {/* Line 2: Start/Return Date */}
                {arretTravail.type === 'reprise' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Date Reprise' : lang === 'ar' ? 'تاريخ الاستئناف' : 'Return Date'}
                    </label>
                    <input
                      type="date"
                      value={arretTravail.startDate}
                      onChange={(e) => {
                        const newAT = { ...arretTravail, startDate: e.target.value };
                        setArretTravail(newAT);
                        notifyDraftUpdate({ arretTravail: newAT });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none font-bold text-emerald-400"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        {lang === 'fr' ? 'Reprise Prévue le' : 'Expected Return'}
                      </label>
                      <div className="px-3.5 py-2 text-sm font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center justify-between h-[42px]">
                        <span>{calculateReturnDate(arretTravail.startDate, arretTravail.days)}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Line 3: Medical Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Motif Médical / Remarques' : 'Medical Justification'}
                  </label>
                  <textarea
                    rows="3"
                    value={arretTravail.reason}
                    onChange={(e) => {
                      const newAT = { ...arretTravail, reason: e.target.value };
                      setArretTravail(newAT);
                      notifyDraftUpdate({ arretTravail: newAT });
                    }}
                    placeholder={t.exSickLeaveJustification || (lang === 'fr' ? "Motif médical / remarques sur l'arrêt..." : "Medical justification for sick leave...")}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-xl focus:border-teal-500 outline-none resize-y"
                  ></textarea>
                </div>

                {/* Add / Save Button for Arrêt de Travail */}
                {arretTravail.idConsultation && (
                  <div className="flex items-center justify-between bg-amber-950/70 border border-amber-800/80 px-3 py-1.5 rounded-xl text-xs text-amber-300 mb-2">
                    <span>{lang === 'fr' ? `Modification de l'arrêt de la consultation en cours` : `Editing current consultation sick leave`}</span>
                    <button
                      type="button"
                      onClick={() => setArretTravail(prev => ({ ...prev, idConsultation: null, exercice: null }))}
                      className="text-amber-400 hover:text-amber-200 underline font-bold cursor-pointer"
                    >
                      {lang === 'fr' ? 'Annuler' : 'Cancel'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {arretSaveStatus ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {arretSaveStatus}
                    </span>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={handleSaveArret}
                    disabled={savingArret || !arretTravail.startDate || !arretTravail.days}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {savingArret
                        ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...')
                        : arretTravail.idConsultation
                          ? (lang === 'fr' ? 'Mettre à jour l\'Arrêt' : 'Update Sick Leave')
                          : (lang === 'fr' ? 'Ajouter / Enregistrer l\'Arrêt' : 'Add / Save Sick Leave')}
                    </span>
                  </button>
                </div>

                {/* Bottom Section: Previous Sick Leaves Table */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-rose-400" />
                      {lang === 'fr' ? 'Historique des Arrêts de Travail du Patient' : 'Patient Sick Leave History'}
                    </h4>
                    {loadingArretHistory && (
                      <span className="text-xs text-rose-400 animate-pulse">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>
                    )}
                  </div>

                  {arretHistory.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">{lang === 'fr' ? 'Type' : 'Type'}</th>
                            <th className="py-2.5 px-3">{lang === 'fr' ? 'Du' : 'From'}</th>
                            <th className="py-2.5 px-3">{lang === 'fr' ? 'Au' : 'To'}</th>
                            <th className="py-2.5 px-3">{lang === 'fr' ? 'Durée' : 'Days'}</th>
                            <th className="py-2.5 px-3">{lang === 'fr' ? 'En Lettres' : 'In Words'}</th>
                            <th className="py-2.5 px-3">{lang === 'fr' ? 'Motif / Remarques' : 'Reason'}</th>
                            <th className="py-2.5 px-3 text-right">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {arretHistory.map((row, idx) => {
                            const typeLabel = Number(row.type) === 2 ? (lang === 'fr' ? 'Prolongation' : 'Extension') : Number(row.type) === 3 ? (lang === 'fr' ? 'Reprise' : 'Return') : (lang === 'fr' ? 'Arrêt de Travail' : 'Sick Leave');
                            const typeBadgeClass = Number(row.type) === 2 ? 'bg-amber-950 text-amber-300 border-amber-800' : Number(row.type) === 3 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800';
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isTodayRecord = Boolean(row.isToday || row.dateArret === todayStr || row.dateDebut === todayStr);

                            return (
                              <tr key={idx} className="hover:bg-slate-900/60 transition">
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${typeBadgeClass}`}>
                                    {typeLabel}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-mono text-teal-300">{row.dateDebut || '-'}</td>
                                <td className="py-2 px-3 font-mono text-teal-300">{row.dateFin || '-'}</td>
                                <td className="py-2 px-3 font-bold text-slate-100 font-mono">{row.nbJour} {lang === 'fr' ? 'j' : 'd'}</td>
                                <td className="py-2 px-3 text-rose-300 font-semibold">{numberToWords(row.nbJour, lang) || '-'}</td>
                                <td className="py-2 px-3 text-slate-400 italic">{row.obs || '-'}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isTodayRecord && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const typeStr = Number(row.type) === 2 ? 'prolongation' : Number(row.type) === 3 ? 'reprise' : 'arret';
                                          const updated = {
                                            ...arretTravail,
                                            type: typeStr,
                                            days: row.nbJour || 1,
                                            startDate: row.dateDebut || todayStr,
                                            reason: row.obs || '',
                                            idConsultation: row.ID_CONSULTATION || row.idConsultation || null,
                                            exercice: row.EXERCICE || row.exercice || null
                                          };
                                          setArretTravail(updated);
                                          notifyDraftUpdate({ arretTravail: updated });
                                        }}
                                        className="p-1 text-teal-400 hover:text-teal-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                        title={lang === 'fr' ? 'Éditer' : 'Edit'}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handlePrintArret(row)}
                                      className="p-1 text-purple-400 hover:text-purple-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                      title={lang === 'fr' ? 'Imprimer' : 'Print'}
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteArret(row)}
                                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                                      title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-slate-500 text-xs italic">
                      {lang === 'fr' ? 'Aucun arrêt de travail antérieur trouvé pour ce patient.' : 'No previous sick leave records found for this patient.'}
                    </div>
                  )}
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
                      placeholder={t.exOtoscopy || (lang === 'fr' ? 'Conduit auditif externe, tympan...' : 'External auditory canal, tympanic membrane...')}
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
                      placeholder={t.exRhinoscopy || (lang === 'fr' ? 'Cloison nasale, cornets, muqueuse...' : 'Nasal septum, turbinates, mucosa...')}
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
                      placeholder={t.exLaryngoscopy || (lang === 'fr' ? 'Cavité buccale, amygdales, pharynx, larynx...' : 'Oral cavity, tonsils, pharynx, larynx...')}
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
                    placeholder={t.exConclusion || (lang === 'fr' ? 'Diagnostic retenu et conclusion clinique...' : 'Diagnosis & clinical conclusion...')}
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
                    placeholder={t.exFollowUp || (lang === 'fr' ? "ex: Contrôle d'otite droite, Ablation de fils..." : "e.g. Follow-up check...")}
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
                    {isBookingAppt ? (lang === 'fr' ? 'Réservation...' : 'Booking...') : (lang === 'fr' ? "Valider le RDV dans l'Agenda" : 'Book Appointment Now')}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* PREVIOUS PRESCRIPTIONS LIST MODAL */}
        {showPastPrescriptionsModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {lang === 'fr' ? 'Historique des Ordonnances du Patient' : 'Patient Prescription History'}
                    </h3>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5">
                      {[activePatient?.NOM || activePatient?.nom || activePatient?.lastName || activePatient?.nomMalade, activePatient?.PRENOM || activePatient?.prenom || activePatient?.firstName || activePatient?.prenomMalade].filter(Boolean).join(' ') || activePatient?.name || activePatient?.FULLNAME || activePatient?.fullname || 'Patient'}
                      {(activePatient?.AGE !== undefined || activePatient?.age !== undefined) && (
                        <span className="text-teal-300 ml-2 font-mono font-bold">
                          • {activePatient?.AGE !== undefined ? activePatient?.AGE : activePatient?.age} {Number(activePatient?.TYPE || activePatient?.type) === 2 ? 'mois' : Number(activePatient?.TYPE || activePatient?.type) === 3 ? 'jours' : 'ans'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPastPrescriptionsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {loadingPastPrescriptions ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>{lang === 'fr' ? 'Chargement des ordonnances...' : 'Loading prescriptions...'}</span>
                  </div>
                ) : pastConsultationsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    {lang === 'fr' ? 'Aucune ordonnance précédente enregistrée pour ce patient.' : 'No previous prescriptions found for this patient.'}
                  </div>
                ) : (
                  pastConsultationsList.map((consult, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {lang === 'fr' ? `Ordonnance du ${consult.date || ''}` : `Prescription (${consult.date || ''})`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintPrescription(consult.prescriptions, consult.date, consult.assureInfo)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                            title={lang === 'fr' ? 'Imprimer cette ordonnance' : 'Print this prescription'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{lang === 'fr' ? 'Imprimer' : 'Print'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLoadPastPrescription(consult.prescriptions)}
                            className="px-3 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer"
                            title={lang === 'fr' ? 'Charger cette ordonnance' : 'Load this prescription'}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{lang === 'fr' ? 'Charger' : 'Load'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Prescription Items */}
                      <div className="space-y-1.5 pt-1">
                        {consult.prescriptions.map((rx, rxIdx) => (
                          <div key={rxIdx} className="text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-slate-200">
                            <span className="font-semibold text-white">{rx.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' • ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* REPLACE PRESCRIPTION CONFIRMATION MODAL */}
        <ReplacePrescriptionModal
          isOpen={showReplaceConfirmModal}
          lang={lang}
          onCancel={() => {
            setShowReplaceConfirmModal(false);
            setPendingRxToLoad(null);
          }}
          onMerge={() => handleMergePrescriptionLoad(pendingRxToLoad)}
          onReplace={() => applyPrescriptionLoad(pendingRxToLoad)}
        />
      </div>

      {/* MODAL DE SÉLECTION DES BILANS À FAIRE */}
      {showBilanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
                  <TestTube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingBilanIndex !== null
                      ? (lang === 'fr' ? 'Modification du Bilan à Faire' : 'Edit Bilan')
                      : (lang === 'fr' ? 'Sélection des Bilans à Faire' : 'Select Tests & Examinations')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingBilanIndex !== null
                      ? (lang === 'fr' ? 'Modifier les examens biologiques & imagerie pour cette consultation' : 'Modify biological & imaging tests for this consultation')
                      : (lang === 'fr' ? 'Cocher les bilans biologiques & examens à prescrire' : 'Check biological & imaging tests to order')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-48 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bilanSearch}
                    onChange={(e) => setBilanSearch(e.target.value)}
                    placeholder={lang === 'fr' ? 'Rechercher un bilan...' : 'Search test...'}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowBilanModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Categorized Grids */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              {/* Category 1: Hématologie & Coagulation */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block flex items-center gap-2 border-b border-slate-800 pb-2">
                  🩸 {lang === 'fr' ? 'Hématologie & Coagulation' : 'Hematology & Coagulation'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'FNS', label: 'FNS' },
                    { key: 'GROUPAGE', label: 'Groupage Sanguin' },
                    { key: 'TP', label: 'TP-TCK' },
                    { key: 'FIBROGENE', label: 'Taux de Fibrogène' },
                    { key: 'VS', label: 'VS' },
                    { key: 'ELETRO_HEMOG', label: "Electrophorèse d'hémoglobine" }
                  ].filter(item => !bilanSearch || item.label.toLowerCase().includes(bilanSearch.toLowerCase())).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-teal-500/40 cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBilans[item.key]}
                        onChange={(e) => setSelectedBilans({ ...selectedBilans, [item.key]: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                      />
                      <span className={selectedBilans[item.key] ? 'text-teal-300 font-semibold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category 2: Biochimie & Organes */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-2 border-b border-slate-800 pb-2">
                  🧪 {lang === 'fr' ? 'Biochimie, Foie & Reins' : 'Biochemistry & Organ Function'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'GLYCEMIE', label: 'Glycémie à jeun' },
                    { key: 'HBA1C', label: 'HbA1C' },
                    { key: 'UREE', label: 'Urée - Créatinémie' },
                    { key: 'URIQUE', label: "Acide Urique" },
                    { key: 'SGOT', label: 'SGOT - SGPT' },
                    { key: 'ASAT', label: 'ASAT - ALAT' },
                    { key: 'GAMMA', label: 'Gamma GT - Palc' },
                    { key: 'PHOSPHATASES', label: 'Phosphatases Alcalines' },
                    { key: 'FER', label: 'Fer Sérique' },
                    { key: 'FERRITINE', label: 'Ferritine' },
                    { key: 'VIT_D', label: 'Dosage Vitamine D' },
                    { key: 'DOSAGE_DEPAKINE', label: 'Dosage Dépakine' }
                  ].filter(item => !bilanSearch || item.label.toLowerCase().includes(bilanSearch.toLowerCase())).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-teal-500/40 cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBilans[item.key]}
                        onChange={(e) => setSelectedBilans({ ...selectedBilans, [item.key]: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                      />
                      <span className={selectedBilans[item.key] ? 'text-cyan-300 font-semibold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Bilirubinémie Sub-options */}
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedBilans.BILIRUBINEMIE}
                      onChange={(e) => setSelectedBilans({ ...selectedBilans, BILIRUBINEMIE: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                    />
                    <span>Bilirubinémie</span>
                  </label>

                  {selectedBilans.BILIRUBINEMIE && (
                    <div className="pl-6 grid grid-cols-3 gap-2">
                      {[
                        { key: 'TOTALE', label: 'Totale' },
                        { key: 'CONJUGE', label: 'Conjuguée' },
                        { key: 'NONCONJUGE', label: 'Non Conjugée' }
                      ].map((sub) => (
                        <label key={sub.key} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!selectedBilans[sub.key]}
                            onChange={(e) => setSelectedBilans({ ...selectedBilans, [sub.key]: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                          />
                          <span className={selectedBilans[sub.key] ? 'text-amber-300 font-semibold' : ''}>{sub.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category 3: Lipides & Ionogramme */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-2 border-b border-slate-800 pb-2">
                  💧 {lang === 'fr' ? 'Lipides & Ionogramme / Minéraux' : 'Lipids & Ionogram'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'CHOLESTEROL', label: 'Cholestérol Total' },
                    { key: 'HDL', label: 'HDL Cholestérol' },
                    { key: 'LDL', label: 'LDL Cholestérol' },
                    { key: 'TRIGLYCERIDE', label: 'Triglycéride' },
                    { key: 'KALIEMIE', label: 'Kaliémie - Natrémie' },
                    { key: 'CALCEMIE', label: 'Calcémie - Phosphorémie' }
                  ].filter(item => !bilanSearch || item.label.toLowerCase().includes(bilanSearch.toLowerCase())).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-teal-500/40 cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBilans[item.key]}
                        onChange={(e) => setSelectedBilans({ ...selectedBilans, [item.key]: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                      />
                      <span className={selectedBilans[item.key] ? 'text-blue-300 font-semibold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category 4: Immunologie & Sérologie / Urines */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-2 border-b border-slate-800 pb-2">
                  🛡️ {lang === 'fr' ? 'Inflammation, Sérologie & Urines' : 'Serology & Urines'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'CRP', label: 'CRP' },
                    { key: 'ASLO', label: 'ASLO' },
                    { key: 'ECBU', label: 'ECBU' },
                    { key: 'ALBUMINEMIE', label: 'Albuminémie' },
                    { key: 'PROTEIN', label: 'Protéinurie' },
                    { key: 'PROTEIN24', label: 'Protéinurie 24h' },
                    { key: 'RUBEOLE', label: 'Sérologie Rubéole' },
                    { key: 'TOXOPLASMOSE', label: 'Sérologie Toxoplasmose' },
                    { key: 'SYPHIS', label: 'Sérologie Syphilis' },
                    { key: 'HIV', label: 'Sérologie HIV' },
                    { key: 'COPRO_PARASIT', label: 'Copro-parasitologie' }
                  ].filter(item => !bilanSearch || item.label.toLowerCase().includes(bilanSearch.toLowerCase())).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-teal-500/40 cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBilans[item.key]}
                        onChange={(e) => setSelectedBilans({ ...selectedBilans, [item.key]: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                      />
                      <span className={selectedBilans[item.key] ? 'text-emerald-300 font-semibold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category 5: Hormonologie */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block flex items-center gap-2 border-b border-slate-800 pb-2">
                  🧬 {lang === 'fr' ? 'Hormonologie & Endocrinologie' : 'Hormonology & Endocrinology'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'FT3', label: 'FT 3 - FT 4' },
                    { key: 'TSHUS', label: 'TSHus' },
                    { key: 'FSH', label: 'FSH' },
                    { key: 'LH', label: 'LH' },
                    { key: 'PROLACTINE', label: 'Prolactine' },
                    { key: 'AMH', label: 'AMH' },
                    { key: 'PROGESTERONE', label: 'Progestérone' },
                    { key: 'DHEA', label: 'S - DHEA' },
                    { key: 'DELTA', label: 'Delta 4 androstènedione' },
                    { key: 'DOSAGE_HORM_CROISS', label: 'Hormone de croissance' }
                  ].filter(item => !bilanSearch || item.label.toLowerCase().includes(bilanSearch.toLowerCase())).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-teal-500/40 cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBilans[item.key]}
                        onChange={(e) => setSelectedBilans({ ...selectedBilans, [item.key]: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                      />
                      <span className={selectedBilans[item.key] ? 'text-purple-300 font-semibold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Sérologie maladie cœliaque Sub-options */}
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-purple-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedBilans.SEROLOGIE_MALADIE_COELIAQUE}
                      onChange={(e) => setSelectedBilans({ ...selectedBilans, SEROLOGIE_MALADIE_COELIAQUE: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-0"
                    />
                    <span>Sérologie maladie cœliaque</span>
                  </label>

                  {selectedBilans.SEROLOGIE_MALADIE_COELIAQUE && (
                    <div className="pl-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'ACS', label: 'ACS' },
                        { key: 'ANTI_TRANSGLUT', label: 'Anti-transglutaminase' },
                        { key: 'ANTIENDOM', label: 'Antiendomisum' },
                        { key: 'ANTI_GLIADINE', label: 'Anti gliadine' }
                      ].map((sub) => (
                        <label key={sub.key} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!selectedBilans[sub.key]}
                            onChange={(e) => setSelectedBilans({ ...selectedBilans, [sub.key]: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-0"
                          />
                          <span className={selectedBilans[sub.key] ? 'text-purple-300 font-semibold' : ''}>{sub.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category 6: Imagerie & Examens Spéciaux */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-2 border-b border-slate-800 pb-2">
                  📷 {lang === 'fr' ? 'Imagerie & Examens Fonctionnels' : 'Imaging & Functional Tests'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'RADIO_MAIN', label: 'Radio de la main' },
                    { key: 'TELETHORAX', label: 'Téléthorax' },
                    { key: 'ETF', label: 'ETF' },
                    { key: 'EEG', label: 'EEG' }
                  ].filter(item => !bilanSearch || item.label.toLowerCase().includes(bilanSearch.toLowerCase())).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-teal-500/40 cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={!!selectedBilans[item.key]}
                        onChange={(e) => setSelectedBilans({ ...selectedBilans, [item.key]: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0"
                      />
                      <span className={selectedBilans[item.key] ? 'text-rose-300 font-semibold' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with ALWAYS VISIBLE 'AUTRE' Input & Action Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3 shrink-0 shadow-lg">
              {/* Always Visible 'AUTRE' Input */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                  ✍️ {lang === 'fr' ? 'Autre / Précisions :' : 'Other / Notes:'}
                </label>
                <input
                  type="text"
                  value={selectedBilans.AUTRE || ''}
                  onChange={(e) => setSelectedBilans({ ...selectedBilans, AUTRE: e.target.value })}
                  placeholder={lang === 'fr' ? 'Saisir un autre bilan ou précisions non listées...' : 'Enter custom exam or details...'}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const keys = Object.keys(selectedBilans);
                    const cleared = {};
                    keys.forEach(k => { cleared[k] = k === 'AUTRE' ? '' : false; });
                    setSelectedBilans(cleared);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBilanModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    {lang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const designationStr = buildBilanDesignation(selectedBilans);
                      if (!designationStr) return;

                      const pId = activePatient?.id || activePatient?.codeBarre || activePatient?.mrn;
                      if (pId) {
                        try {
                          await fetch(`/api/patients/${encodeURIComponent(pId)}/bilan-coche`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ selectedBilans })
                          });
                          fetchBilanCocheHistory(pId);
                        } catch (err) {
                          console.error('Error saving selected bilans to DB:', err);
                        }
                      }

                      const updatedBilan = {
                        ...bilan,
                        clinicalIndication: designationStr
                      };
                      setBilan(updatedBilan);
                      notifyDraftUpdate({ bilan: updatedBilan });

                      setShowBilanModal(false);
                      setEditingBilanIndex(null);
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-bold rounded-xl border border-teal-400 hover:from-teal-400 hover:to-cyan-400 shadow-md shadow-teal-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingBilanIndex !== null ? (lang === 'fr' ? 'Valider la modification' : 'Save Changes') : (lang === 'fr' ? 'Valider et Ajouter' : 'Validate and Add')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
