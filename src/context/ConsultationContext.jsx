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
import { generatePrescriptionHtml } from '../components/prescriptionTemplates';
import { renderBilanBody } from '../components/prescriptionTemplates/documentBodies';
import { useConfirm } from '../context/ConfirmDialogContext';

import { createContext, useContext } from 'react';
const ConsultationContext = createContext();
export const useConsultation = () => useContext(ConsultationContext);

export const ConsultationProvider = ({ children, draft, patient, patients = [], onSelectPatient, onConsultationAdded, onCancel, onUpdateDraft, onClose, onEditPatient, onOpenNewConsultation, lang = 'fr', clinicInfo }) => {
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
      otoscopie: '',
      rhinoscopie: '',
      laryngoscopie: '',
      conclusion: 'Examen & Document doc_medical',
      customNotes: ''
    }
  );

  const [availableMotifs, setAvailableMotifs] = useState([]);
  const [patientHistoricalMotifs, setPatientHistoricalMotifs] = useState([]);
  const [selectedMotifs, setSelectedMotifs] = useState(draft?.selectedMotifs || []);
  const [currentMotifSelection, setCurrentMotifSelection] = useState("");

  useEffect(() => {
    // Fetch active motifs
    fetch('/api/motif')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableMotifs(data.filter(m => m.ETAT === 1));
        }
      })
      .catch(err => console.error("Error fetching motifs:", err));
  }, []);

  useEffect(() => {
    // Fetch historical motifs for patient
    if (activePatient?.id || activePatient?.codeBarre) {
      const pId = activePatient.id || activePatient.codeBarre;
      fetch(`/api/patients/${pId}/motifs`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPatientHistoricalMotifs(data);
          }
        })
        .catch(err => console.error("Error fetching historical motifs:", err));
    } else {
      setPatientHistoricalMotifs([]);
    }
  }, [activePatient]);

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
      if (draft.selectedMotifs) setSelectedMotifs(draft.selectedMotifs);
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
          if (c.selectedMotifs) setSelectedMotifs(c.selectedMotifs);
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
            selectedMotifs: c.selectedMotifs || selectedMotifs,
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
        selectedMotifs: updatedFields.selectedMotifs || selectedMotifs,
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

  // Shared date formatter used in print handlers and exposed via context
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

  // Print Bilan (Lab/Radiology request) using Design 3 layout
  const handlePrintBilan = (rowToPrint = null) => {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) {
      window.print();
      return;
    }

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
      selectedMotifs,
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
          selectedMotifs,
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

  const contextValue = {
    draft, patient, patients, onSelectPatient, onConsultationAdded, onCancel, onUpdateDraft, onClose, onEditPatient, onOpenNewConsultation, lang, clinicInfo, confirm, activePatient,
    activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit
  };
  return (
    <ConsultationContext.Provider value={contextValue}>
      {children}
    </ConsultationContext.Provider>
  );
};
