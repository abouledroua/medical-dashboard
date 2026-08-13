import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity, ShieldAlert, AlertTriangle, Edit3, Plus, Stethoscope, Save, X, CheckCircle2, Heart, Layers, User, Users, Sparkles, Calendar, TestTube, Trash2 } from 'lucide-react';

import ObservationTab from './PatientOverview/ObservationTab';
import AntecedentsTab from './PatientOverview/AntecedentsTab';
import VitalsTab from './PatientOverview/VitalsTab';
import MeasurementsTab from './PatientOverview/MeasurementsTab';
import DietTab from './PatientOverview/DietTab';
import ObstetricsTab from './PatientOverview/ObstetricsTab';
import ConsultDiagnosisTab from './PatientOverview/ConsultDiagnosisTab';
import GeneralDiagnosisTab from './PatientOverview/GeneralDiagnosisTab';
import { translations } from '../translations';
import { useConfirm } from '../context/ConfirmDialogContext';

function normalizeList(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.flatMap(v => normalizeList(v)).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [String(val)];
}

export default function PatientOverviewPanel({
  patient,
  onEditPatient,
  onOpenNewConsultation,
  lang = 'fr',
  className = '',
  title,
  clinicInfo
}) {
  const t = translations[lang] || translations.fr;
  const confirm = useConfirm();
  const [fullPatientData, setFullPatientData] = useState(patient);
  const [isEditingVitalsModal, setIsEditingVitalsModal] = useState(false);
  const [localClinicInfo, setLocalClinicInfo] = useState(clinicInfo || null);

  useEffect(() => {
    if (clinicInfo) {
      setLocalClinicInfo(clinicInfo);
    } else {
      fetch('/api/clinic')
        .then(res => res.json())
        .then(data => setLocalClinicInfo(data))
        .catch(() => { });
    }
  }, [clinicInfo]);

  // Form states for Vitals & Consultation Info Modal
  const [editBP, setEditBP] = useState('');
  const [editHR, setEditHR] = useState('');
  const [editO2, setEditO2] = useState('');
  const [editGlucose, setEditGlucose] = useState('');
  const [editComplaint, setEditComplaint] = useState('');
  const [editTaille, setEditTaille] = useState('');
  const [editPoids, setEditPoids] = useState('');
  const [editPerimCran, setEditPerimCran] = useState('');
  const [editAlimentation, setEditAlimentation] = useState('');
  const [editDDR, setEditDDR] = useState('');
  const [editDPA, setEditDPA] = useState('');
  const [editDiagConsult, setEditDiagConsult] = useState('');
  const [editExplorConsult, setEditExplorConsult] = useState('');
  const [editAntecedents, setEditAntecedents] = useState('');
  const [editAntecedentsFam, setEditAntecedentsFam] = useState('');

  // Antécédents & Allergies lists state for edit modal
  const [newPersonalInput, setNewPersonalInput] = useState('');
  const [personalListState, setPersonalListState] = useState([]);
  const [newFamilyInput, setNewFamilyInput] = useState('');
  const [familyListState, setFamilyListState] = useState([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [allergyListState, setAllergyListState] = useState([]);

  // Active view tab state (Observation, Antécédent, TA & Battement, Taille, Poids, etc.)
  const [activeTab, setActiveTab] = useState('observation');

  // DB Antecedents & Allergies assistance suggestions
  const [personalDbSuggestions, setPersonalDbSuggestions] = useState([]);
  const [familyDbSuggestions, setFamilyDbSuggestions] = useState([]);
  const [allergyDbSuggestions, setAllergyDbSuggestions] = useState([]);
  const [showPersonalDropdown, setShowPersonalDropdown] = useState(false);
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);

  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);

  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loadingVitalsHistory, setLoadingVitalsHistory] = useState(false);

  useEffect(() => {
    if (!isEditingVitalsModal || activeTab !== 'antecedent') {
      if (activeTab === 'antecedent') {
        setPersonalDbSuggestions([]);
      }
      return;
    }

    const handler = setTimeout(() => {
      const query = newPersonalInput.trim();
      fetch(`/api/patients/antecedents/personal?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setPersonalDbSuggestions(data); })
        .catch(() => setPersonalDbSuggestions([]));
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [newPersonalInput, isEditingVitalsModal, activeTab]);

  useEffect(() => {
    if (!isEditingVitalsModal || activeTab !== 'antecedent') {
      if (activeTab === 'antecedent') {
        setFamilyDbSuggestions([]);
      }
      return;
    }

    const handler = setTimeout(() => {
      const query = newFamilyInput.trim();
      fetch(`/api/patients/antecedents/family?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setFamilyDbSuggestions(data); })
        .catch(() => setFamilyDbSuggestions([]));
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [newFamilyInput, isEditingVitalsModal, activeTab]);

  useEffect(() => {
    if (!isEditingVitalsModal || activeTab !== 'antecedent') {
      if (activeTab === 'antecedent') {
        setAllergyDbSuggestions([]);
      }
      return;
    }

    const handler = setTimeout(() => {
      const query = newAllergyInput.trim();
      fetch(`/api/patients/allergies/suggestions?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAllergyDbSuggestions(data); })
        .catch(() => setAllergyDbSuggestions([]));
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [newAllergyInput, isEditingVitalsModal, activeTab]);

  // Observation list state
  const [patientObservations, setPatientObservations] = useState([]);
  const [loadingObservations, setLoadingObservations] = useState(false);

  // Height, Weight, Head Circ list state
  const [patientHeights, setPatientHeights] = useState([]);
  const [loadingHeights, setLoadingHeights] = useState(false);
  const [patientWeights, setPatientWeights] = useState([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [patientHeadCircs, setPatientHeadCircs] = useState([]);
  const [loadingHeadCircs, setLoadingHeadCircs] = useState(false);

  // Nutrition list state
  const [patientNutritions, setPatientNutritions] = useState([]);
  const [loadingNutritions, setLoadingNutritions] = useState(false);

  // Consult Diagnosis list state
  const [patientDiagConsults, setPatientDiagConsults] = useState([]);
  const [loadingDiagConsults, setLoadingDiagConsults] = useState(false);

  // DDR & DPA list state
  const [patientDdrDpaList, setPatientDdrDpaList] = useState([]);
  const [loadingDdrDpaList, setLoadingDdrDpaList] = useState(false);

  const fetchObservations = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingObservations(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/observations`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientObservations(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayObs = data.find(item => item.date === todayStr);
          if (todayObs && todayObs.observation) {
            setEditComplaint(todayObs.observation);
          }
        } else {
          setPatientObservations([]);
        }
      })
      .catch(() => { setPatientObservations([]); })
      .finally(() => setLoadingObservations(false));
  };

  const fetchHeights = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingHeights(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/height`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientHeights(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRecord = data.find(item => item.date === todayStr);
          if (todayRecord && todayRecord.height) {
            setEditTaille(String(todayRecord.height));
          }
        } else {
          setPatientHeights([]);
        }
      })
      .catch(() => { setPatientHeights([]); })
      .finally(() => setLoadingHeights(false));
  };

  const fetchWeights = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingWeights(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/weight`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientWeights(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRecord = data.find(item => item.date === todayStr);
          if (todayRecord && todayRecord.weight) {
            setEditPoids(String(todayRecord.weight));
          }
        } else {
          setPatientWeights([]);
        }
      })
      .catch(() => { setPatientWeights([]); })
      .finally(() => setLoadingWeights(false));
  };

  const fetchHeadCircs = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingHeadCircs(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/head-circ`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientHeadCircs(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRecord = data.find(item => item.date === todayStr);
          if (todayRecord && todayRecord.headCirc) {
            setEditPerimCran(String(todayRecord.headCirc));
          }
        } else {
          setPatientHeadCircs([]);
        }
      })
      .catch(() => { setPatientHeadCircs([]); })
      .finally(() => setLoadingHeadCircs(false));
  };

  const fetchNutritions = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingNutritions(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/nutrition`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientNutritions(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRecord = data.find(item => item.date === todayStr);
          if (todayRecord && todayRecord.nutrition) {
            setEditAlimentation(todayRecord.nutrition);
          }
        } else {
          setPatientNutritions([]);
        }
      })
      .catch(() => { setPatientNutritions([]); })
      .finally(() => setLoadingNutritions(false));
  };

  const fetchDiagConsults = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingDiagConsults(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/diag-consult`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientDiagConsults(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRecord = data.find(item => item.date === todayStr);
          if (todayRecord && todayRecord.diagnosis) {
            setEditDiagConsult(todayRecord.diagnosis);
          }
        } else {
          setPatientDiagConsults([]);
        }
      })
      .catch(() => { setPatientDiagConsults([]); })
      .finally(() => setLoadingDiagConsults(false));
  };

  const fetchDdrDpaList = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    setLoadingDdrDpaList(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/ddr-dpa`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatientDdrDpaList(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRecord = data.find(item => item.date === todayStr);
          if (todayRecord) {
            if (todayRecord.ddr) setEditDDR(todayRecord.ddr);
            if (todayRecord.dpa) setEditDPA(todayRecord.dpa);
          }
        } else {
          setPatientDdrDpaList([]);
        }
      })
      .catch(() => { setPatientDdrDpaList([]); })
      .finally(() => setLoadingDdrDpaList(false));
  };

  const fetchGeneralDiagnosis = (targetPat) => {
    const patId = targetPat?.id || targetPat?.codeBarre || targetPat?.mrn || patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;
    fetch(`/api/patients/${encodeURIComponent(patId)}/general-diagnosis`)
      .then(res => res.json())
      .then(data => {
        if (data && data.generalDiagnosis !== undefined) {
          setEditExplorConsult(data.generalDiagnosis || '');
        }
      })
      .catch(() => { });
  };

  const handleDeleteObservation = async (obsId) => {
    const isConfirmed = await confirm({
      title: lang === 'fr' ? 'Supprimer l\'observation' : 'Delete Observation',
      message: lang === 'fr' ? 'Voulez-vous vraiment supprimer cette observation ?' : 'Are you sure you want to delete this observation?',
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/observations/${obsId}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientObservations(prev => prev.filter(item => String(item.id) !== String(obsId)));
      }
    } catch (err) {
      console.error('Error deleting observation:', err);
    }
  };

  const handleDeleteHeight = async (heightId) => {
    const isConfirmed = await confirm({
      title: t('deleteHeightTitle'),
      message: t('deleteHeightMessage'),
      confirmText: t('deleteConfirm'),
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/height/${heightId}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientHeights(prev => prev.filter(item => String(item.id) !== String(heightId)));
      }
    } catch (err) {
      console.error('Error deleting height record:', err);
    }
  };

  const handleDeleteWeight = async (weightId) => {
    const isConfirmed = await confirm({
      title: t('deleteWeightTitle'),
      message: t('deleteWeightMessage'),
      confirmText: t('deleteConfirm'),
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/weight/${weightId}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientWeights(prev => prev.filter(item => String(item.id) !== String(weightId)));
      }
    } catch (err) {
      console.error('Error deleting weight record:', err);
    }
  };

  const handleDeleteHeadCirc = async (id) => {
    const isConfirmed = await confirm({
      title: t('deleteHeadCircTitle'),
      message: t('deleteHeadCircMessage'),
      confirmText: t('deleteConfirm'),
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/head-circ/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientHeadCircs(prev => prev.filter(item => String(item.id) !== String(id)));
      }
    } catch (err) {
      console.error('Error deleting head circ record:', err);
    }
  };

  const handleDeleteNutrition = async (id) => {
    const isConfirmed = await confirm({
      title: lang === 'fr' ? 'Supprimer l\'alimentation' : 'Delete Nutrition',
      message: lang === 'fr' ? 'Voulez-vous vraiment supprimer cet enregistrement d’alimentation ?' : 'Are you sure you want to delete this nutrition record?',
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/nutrition/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientNutritions(prev => prev.filter(item => String(item.id) !== String(id)));
      }
    } catch (err) {
      console.error('Error deleting nutrition record:', err);
    }
  };

  const handleDeleteDiagConsult = async (id) => {
    const isConfirmed = await confirm({
      title: lang === 'fr' ? 'Supprimer le diagnostic' : 'Delete Diagnosis',
      message: lang === 'fr' ? 'Voulez-vous vraiment supprimer ce diagnostic de consultation ?' : 'Are you sure you want to delete this consult diagnosis record?',
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/diag-consult/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientDiagConsults(prev => prev.filter(item => String(item.id) !== String(id)));
      }
    } catch (err) {
      console.error('Error deleting consult diagnosis record:', err);
    }
  };

  const handleDeleteDdrDpa = async (id) => {
    const isConfirmed = await confirm({
      title: lang === 'fr' ? 'Supprimer l\'enregistrement' : 'Delete Record',
      message: lang === 'fr' ? 'Voulez-vous vraiment supprimer cet enregistrement DDR/DPA ?' : 'Are you sure you want to delete this LMP/EDD record?',
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/ddr-dpa/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatientDdrDpaList(prev => prev.filter(item => String(item.id) !== String(id)));
      }
    } catch (err) {
      console.error('Error deleting DDR/DPA record:', err);
    }
  };

  const handleAddPersonalAntecedent = async () => {
    if (!newPersonalInput || !newPersonalInput.trim()) return;
    const item = newPersonalInput.trim();
    const updated = Array.from(new Set([...personalListState, item]));
    setPersonalListState(updated);
    setFullPatientData(prev => ({
      ...prev,
      personalAntecedents: updated,
      chronicConditions: updated
    }));
    setNewPersonalInput('');

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      await fetch(`/api/patients/${encodeURIComponent(patId)}/personal-antecedents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ antecedents: updated })
      }).catch(e => console.error('Error saving personal antecedents:', e));
    }
  };

  const handleDeletePersonalAntecedent = async (indexToRemove) => {
    const updated = personalListState.filter((_, idx) => idx !== indexToRemove);
    setPersonalListState(updated);
    setFullPatientData(prev => ({
      ...prev,
      personalAntecedents: updated,
      chronicConditions: updated
    }));

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      await fetch(`/api/patients/${encodeURIComponent(patId)}/personal-antecedents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ antecedents: updated })
      }).catch(e => console.error('Error saving personal antecedents:', e));
    }
  };

  const handleAddFamilyAntecedent = async () => {
    if (!newFamilyInput || !newFamilyInput.trim()) return;
    const item = newFamilyInput.trim();
    const updated = Array.from(new Set([...familyListState, item]));
    setFamilyListState(updated);
    setFullPatientData(prev => ({
      ...prev,
      familyAntecedents: updated,
      familyHistory: updated
    }));
    setNewFamilyInput('');

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      await fetch(`/api/patients/${encodeURIComponent(patId)}/family-antecedents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ antecedents: updated })
      }).catch(e => console.error('Error saving family antecedents:', e));
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergyInput || !newAllergyInput.trim()) return;
    const item = newAllergyInput.trim();
    const updated = Array.from(new Set([...allergyListState, item]));
    setAllergyListState(updated);
    setFullPatientData(prev => ({
      ...prev,
      allergies: updated
    }));
    setNewAllergyInput('');

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      await fetch(`/api/patients/${encodeURIComponent(patId)}/allergies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergies: updated })
      }).catch(e => console.error('Error saving allergies:', e));
    }
  };

  const handleDeleteAllergy = async (indexToRemove) => {
    const updated = allergyListState.filter((_, idx) => idx !== indexToRemove);
    setAllergyListState(updated);
    setFullPatientData(prev => ({
      ...prev,
      allergies: updated
    }));

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      await fetch(`/api/patients/${encodeURIComponent(patId)}/allergies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergies: updated })
      }).catch(e => console.error('Error saving allergies:', e));
    }
  };

  const handleDeleteFamilyAntecedent = async (indexToRemove) => {
    const updated = familyListState.filter((_, idx) => idx !== indexToRemove);
    setFamilyListState(updated);
    setFullPatientData(prev => ({
      ...prev,
      familyAntecedents: updated,
      familyHistory: updated
    }));

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      await fetch(`/api/patients/${encodeURIComponent(patId)}/family-antecedents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ antecedents: updated })
      }).catch(e => console.error('Error saving family antecedents:', e));
    }
  };

  const fetchVitalsHistory = (pData) => {
    const patId = pData?.id || pData?.codeBarre || pData?.mrn || (typeof pData === 'string' ? pData : '');
    if (!patId) return;
    setLoadingVitalsHistory(true);
    fetch(`/api/patients/${encodeURIComponent(patId)}/vitals-history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVitalsHistory(data);
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayRec = data.find(item => item.date === todayStr);
          if (todayRec) {
            if (todayRec.bp && todayRec.bp !== 'N/A') setEditBP(todayRec.bp);
            if (todayRec.hr && todayRec.hr !== 'N/A') setEditHR(todayRec.hr);
            if (todayRec.spo2 && todayRec.spo2 !== 'N/A') setEditO2(String(todayRec.spo2));
            if (todayRec.bg && todayRec.bg !== 'N/A') setEditGlucose(String(todayRec.bg));
          }
        } else {
          setVitalsHistory([]);
        }
      })
      .catch(() => { setVitalsHistory([]); })
      .finally(() => setLoadingVitalsHistory(false));
  };

  const handleDeleteVitals = async (date) => {
    const patId = p.id || p.codeBarre || p.mrn;
    if (!patId || !date) return;
    const isConfirmed = await confirm({
      title: lang === 'fr' ? 'Supprimer les signes vitaux' : 'Delete Vitals',
      message: lang === 'fr' ? `Voulez-vous supprimer les signes vitaux du ${date} ?` : `Delete vitals for ${date}?`,
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      variant: 'danger'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patId)}/vitals?date=${encodeURIComponent(date)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVitalsHistory(p);
      }
    } catch (err) {
      console.error('Error deleting vitals record:', err);
    }
  };

  const fetchConsultations = (patientId) => {
    if (!patientId) return;
    setLoadingConsultations(true);
    fetch(`/api/patients/${encodeURIComponent(patientId)}/consultations`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConsultations(data);
        } else {
          setConsultations([]);
        }
      })
      .catch(() => { setConsultations([]); })
      .finally(() => setLoadingConsultations(false));
  };

  useEffect(() => {
    if (isEditingVitalsModal) {
      if (activeTab === 'taBattement') {
        const patId = patient.id || patient.codeBarre || patient.mrn;
        fetchVitalsHistory(patId);
      } else if (activeTab === 'observation') {
        fetchObservations(patient);
      } else if (activeTab === 'mensurations' || activeTab === 'taille' || activeTab === 'poids' || activeTab === 'perimCran') {
        fetchHeights(patient);
        fetchWeights(patient);
        fetchHeadCircs(patient);
      } else if (activeTab === 'alimentation') {
        fetchNutritions(patient);
      } else if (activeTab === 'diagConsult') {
        fetchDiagConsults(patient);
      } else if (activeTab === 'ddrDpa') {
        fetchDdrDpaList(patient);
      } else if (activeTab === 'explorConsult') {
        fetchGeneralDiagnosis(patient);
      }
    }
  }, [isEditingVitalsModal, activeTab]);

  const combinedMensurationsHistory = React.useMemo(() => {
    const mapByDate = {};

    patientHeights.forEach(item => {
      if (!item.date) return;
      if (!mapByDate[item.date]) mapByDate[item.date] = { date: item.date };
      mapByDate[item.date].height = item.height;
      mapByDate[item.date].heightId = item.id;
    });

    patientWeights.forEach(item => {
      if (!item.date) return;
      if (!mapByDate[item.date]) mapByDate[item.date] = { date: item.date };
      mapByDate[item.date].weight = item.weight;
      mapByDate[item.date].weightId = item.id;
    });

    patientHeadCircs.forEach(item => {
      if (!item.date) return;
      if (!mapByDate[item.date]) mapByDate[item.date] = { date: item.date };
      mapByDate[item.date].headCirc = item.headCirc;
      mapByDate[item.date].headCircId = item.id;
    });

    return Object.values(mapByDate).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [patientHeights, patientWeights, patientHeadCircs]);

  // Active view tab state (Observation, Antécédent, TA & Battement, Mensurations, etc.)

  const allTabs = [
    { id: 'observation', dbKey: 'OBS', label: lang === 'fr' ? 'Observation' : 'Observation', icon: Stethoscope, color: 'from-teal-500 to-emerald-500' },
    { id: 'antecedent', dbKey: 'ANT', label: lang === 'fr' ? 'Antécédents & Allergies' : 'Antecedents & Allergies', icon: Activity, color: 'from-amber-500 to-orange-500' },
    { id: 'taBattement', dbKey: 'TA', label: lang === 'fr' ? 'TA & Battement' : 'BP & HR', icon: Heart, color: 'from-rose-500 to-pink-500' },
    { id: 'mensurations', dbKey: 'TAILLE', label: lang === 'fr' ? 'Mensurations (Taille, Poids, PC)' : 'Body Measurements (Height, Weight, Head Circ.)', icon: Layers, color: 'from-cyan-500 to-teal-500' },
    { id: 'alimentation', dbKey: 'ALIMENTATION', label: lang === 'fr' ? 'Alimentation' : 'Nutrition', icon: Sparkles, color: 'from-amber-400 to-yellow-500' },
    { id: 'ddrDpa', dbKey: 'DDR', label: lang === 'fr' ? 'DDR && DPA' : 'LMP && EDD', icon: Calendar, color: 'from-pink-500 to-rose-500' },
    { id: 'diagConsult', dbKey: 'DIAG_CONS', label: lang === 'fr' ? 'Diagnostic Consult.' : 'Consult. Diagnosis', icon: CheckCircle2, color: 'from-teal-400 to-cyan-500' },
    { id: 'explorConsult', dbKey: 'DIAG_G', label: lang === 'fr' ? 'Diagnostique Géneral' : 'General Diagnosis', icon: TestTube, color: 'from-blue-500 to-indigo-500' },
  ];

  const visibleTabs = React.useMemo(() => {
    return allTabs.filter(tab => {
      if (!localClinicInfo?.paramInfoSupp) return true;
      const dbVal = localClinicInfo.paramInfoSupp[tab.dbKey];
      return Number(dbVal) === 1;
    });
  }, [localClinicInfo?.paramInfoSupp, lang]);

  const visibleTabIds = visibleTabs.map(t => t.id).join(',');

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabIds, activeTab]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setFullPatientData(patient);

    const patId = patient?.id || patient?.codeBarre || patient?.mrn;
    if (!patId) return;

    let isMounted = true;
    fetch(`/api/patients/${encodeURIComponent(patId)}`)
      .then(res => {
        if (!res.ok) throw new Error('Patient not found');
        return res.json();
      })
      .then(data => {
        if (isMounted && data && !data.error) {
          setFullPatientData(prev => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(() => { });

    return () => { isMounted = false; };
  }, [patient?.id, patient?.codeBarre, patient?.mrn]);

  useEffect(() => {
    if (patient?.id || patient?.codeBarre || patient?.mrn) {
      fetchObservations(patient);
      fetchDiagConsults(patient);
      fetchGeneralDiagnosis(patient);
    }
  }, [patient?.id, patient?.codeBarre, patient?.mrn]);

  const p = fullPatientData || patient || {};
  const vitals = p.vitals || {};

  const bpVal = (vitals.bloodPressure && vitals.bloodPressure !== 'N/A')
    ? vitals.bloodPressure
    : (p.lastHTA || p.HTA
      ? (String(p.lastHTA || p.HTA).includes('/')
        ? `${p.lastHTA || p.HTA} mmHg`
        : `${p.lastHTA || p.HTA} cmHg`)
      : 'N/A');

  const hrVal = (vitals.heartRate && vitals.heartRate !== 'N/A')
    ? vitals.heartRate
    : (p.lastBatement || p.BATEMENT
      ? (String(p.lastBatement || p.BATEMENT).includes('bpm')
        ? `${p.lastBatement || p.BATEMENT}`
        : `${p.lastBatement || p.BATEMENT} bpm`)
      : 'N/A');

  const spo2Val = (vitals.oxygenSat && vitals.oxygenSat !== 'N/A')
    ? vitals.oxygenSat
    : (p.lastSpo2 ? `${p.lastSpo2}%` : 'N/A');

  const bgVal = (vitals.bloodGlucose && vitals.bloodGlucose !== 'N/A')
    ? vitals.bloodGlucose
    : (p.lastBg ? `${p.lastBg} g/L` : 'N/A');

  const lastUpdatedVal = vitals.lastUpdated && vitals.lastUpdated !== 'N/A'
    ? vitals.lastUpdated
    : (p.lastDateHTA ? new Date(p.lastDateHTA).toISOString().split('T')[0] : 'N/A');

  const allergyList = Array.from(new Set(normalizeList([
    p.allergies,
    p.allergie,
    p.ALLERGIE
  ])));

  const diagList = Array.from(new Set(normalizeList([
    p.keyDiagnostics,
    p.diagnostics,
    p.diagnoses,
    p.primaryDiagnosis
  ])));

  const familyList = Array.from(new Set(normalizeList([
    p.familyAntecedents,
    p.familyHistory,
    p.antecedentsFamiliaux,
    p.antecedentsF,
    p.antecedentFamilial
  ])));

  const diagSet = new Set(diagList);
  const personalItems = Array.from(new Set(normalizeList([
    p.personalAntecedents,
    p.chronicConditions,
    p.medicalHistory,
    p.antecedentsPersonnels,
    p.antecedentsP
  ]))).filter(item => Boolean(item) && !diagSet.has(item));

  const generalDiag = p.generalDiagnosis || p.DIAGNOSTIQUE || p.diagnostique || (p.chronicConditions && p.chronicConditions.length > 0 ? p.chronicConditions.join(', ') : '');

  const handleOpenVitalsModal = () => {
    fetch('/api/clinic')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setLocalClinicInfo(data);
      })
      .catch(() => { });
    fetchObservations(p);
    fetchHeights(p);
    fetchWeights(p);
    fetchHeadCircs(p);
    fetchNutritions(p);
    fetchDiagConsults(p);
    fetchDdrDpaList(p);
    fetchGeneralDiagnosis(p);
    setEditBP(vitals?.bloodPressure && vitals?.bloodPressure !== 'N/A' ? vitals.bloodPressure : '');
    setEditHR(vitals?.heartRate && vitals?.heartRate !== 'N/A' ? vitals.heartRate : '');
    setEditO2(vitals?.oxygenSat && vitals?.oxygenSat !== 'N/A' ? vitals.oxygenSat : '');
    setEditGlucose(vitals?.bloodGlucose && vitals?.bloodGlucose !== 'N/A' ? vitals.bloodGlucose : '');
    setEditTaille(p.heightCm ? String(p.heightCm) : '');
    setEditPoids(p.weightKg ? String(p.weightKg) : '');
    setEditPerimCran('');
    setEditAlimentation('');
    setEditDDR('');
    setEditDPA('');
    setEditDiagConsult(diagList.length > 0 ? diagList.join(', ') : '');
    setEditExplorConsult(p.generalDiagnosis || p.diagnostique || (p.chronicConditions && p.chronicConditions.length > 0 ? p.chronicConditions.join(', ') : ''));
    setEditAntecedents(personalItems.length > 0 ? personalItems.join(', ') : '');
    setEditAntecedentsFam(familyList.length > 0 ? familyList.join(', ') : '');
    setPersonalListState(personalItems);
    setFamilyListState(familyList);
    setAllergyListState(allergyList);
    setNewPersonalInput('');
    setNewFamilyInput('');
    setNewAllergyInput('');
    setEditComplaint('');
    setSaveSuccess('');

    const patId = p.id || p.codeBarre || p.mrn;
    if (patId) {
      fetchVitalsHistory(patId);
    }

    setIsEditingVitalsModal(true);
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const patId = p.id || p.codeBarre || p.mrn;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newVitals = {
      bloodPressure: editBP || 'N/A',
      heartRate: editHR || 'N/A',
      oxygenSat: editO2 || 'N/A',
      bloodGlucose: editGlucose || 'N/A',
      lastUpdated: todayStr
    };

    // Instant local state update
    setFullPatientData(prev => ({
      ...prev,
      vitals: newVitals,
      heightCm: editTaille ? Number(editTaille) : prev.heightCm,
      weightKg: editPoids ? Number(editPoids) : prev.weightKg,
      generalDiagnosis: editExplorConsult || prev.generalDiagnosis,
      chronicConditions: editExplorConsult ? [editExplorConsult] : prev.chronicConditions
    }));

    if (patId) {
      try {
        // Sync hta_malade, spo2_malade, and bg_malade tables for today
        await fetch(`/api/patients/${encodeURIComponent(patId)}/vitals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bp: editBP || null,
            hr: editHR || null,
            spo2: editO2 || null,
            bg: editGlucose || null,
            date: todayStr
          })
        }).catch(e => console.error('Error syncing vitals tables:', e));

        fetchVitalsHistory(patId);

        if (editComplaint && editComplaint.trim()) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/observations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ observation: editComplaint.trim() })
          }).catch(e => console.error('Error saving observation:', e));
          fetchObservations(p);
        }

        if (editTaille && String(editTaille).trim()) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/height`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ height: String(editTaille).trim() })
          }).catch(e => console.error('Error saving height record:', e));
          fetchHeights(p);
        }

        if (editPoids && String(editPoids).trim()) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/weight`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: String(editPoids).trim() })
          }).catch(e => console.error('Error saving weight record:', e));
          fetchWeights(p);
        }

        if (editPerimCran && String(editPerimCran).trim()) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/head-circ`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headCirc: String(editPerimCran).trim() })
          }).catch(e => console.error('Error saving head circ record:', e));
          fetchHeadCircs(p);
        }

        if (editAlimentation && editAlimentation.trim()) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/nutrition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nutrition: editAlimentation.trim() })
          }).catch(e => console.error('Error saving nutrition record:', e));
          fetchNutritions(p);
        }

        if (editDiagConsult && editDiagConsult.trim()) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/diag-consult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnosis: editDiagConsult.trim() })
          }).catch(e => console.error('Error saving consult diagnosis record:', e));
          fetchDiagConsults(p);
        }

        if ((editDDR && editDDR.trim()) || (editDPA && editDPA.trim())) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/ddr-dpa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ddr: editDDR ? editDDR.trim() : '',
              dpa: editDPA ? editDPA.trim() : ''
            })
          }).catch(e => console.error('Error saving DDR/DPA record:', e));
          fetchDdrDpaList(p);
        }

        if (editExplorConsult !== undefined) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/general-diagnosis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generalDiagnosis: editExplorConsult })
          }).catch(e => console.error('Error saving general diagnosis:', e));
          fetchGeneralDiagnosis(p);
        }

        if (familyListState && familyListState.length > 0) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/family-antecedents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ antecedents: familyListState })
          }).catch(e => console.error('Error saving family antecedents:', e));
        }

        if (personalListState && personalListState.length > 0) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/personal-antecedents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ antecedents: personalListState })
          }).catch(e => console.error('Error saving personal antecedents:', e));
        }

        if (allergyListState) {
          await fetch(`/api/patients/${encodeURIComponent(patId)}/allergies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allergies: allergyListState })
          }).catch(e => console.error('Error saving allergies:', e));
        }

        const notesSummary = [
          editComplaint ? `Observation: ${editComplaint}` : '',
          editDiagConsult ? `Diagnostic: ${editDiagConsult}` : '',
          editAntecedents ? `Antécédents Personnels: ${editAntecedents}` : '',
          editAntecedentsFam ? `Antécédents Familiaux: ${editAntecedentsFam}` : '',
          editAlimentation ? `Alimentation: ${editAlimentation}` : '',
          editDDR ? `DDR: ${editDDR}` : '',
          editDPA ? `DPA: ${editDPA}` : '',
          editExplorConsult ? `Exploration: ${editExplorConsult}` : '',
        ].filter(Boolean).join(' | ');

        await fetch(`/api/patients/${encodeURIComponent(patId)}/consultations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chiefComplaint: editComplaint || editDiagConsult || (lang === 'fr' ? 'Saisie des données de consultation' : 'Consultation entry'),
            diagnosis: editDiagConsult || 'Consultation',
            clinicalNotes: notesSummary || (lang === 'fr' ? 'Signes vitaux mis à jour depuis le panneau du patient.' : 'Vitals updated from patient panel.'),
            vitalsAtVisit: `TA: ${editBP} | FC: ${editHR} | SpO2: ${editO2} | Glycémie: ${editGlucose} | Taille: ${editTaille}cm | Poids: ${editPoids}kg`
          })
        });
      } catch (err) {
        console.error('Error saving vitals consultation record:', err);
      }
    }

    setIsSaving(false);
    setSaveSuccess(lang === 'fr' ? 'Saisie enregistrée avec succès !' : 'Record saved successfully!');
    setTimeout(() => {
      setSaveSuccess('');
    }, 2500);
  };

  return (
    <div className={`glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 ${className}`}>
      {/* Header Title Bar with Dual Edit Buttons */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            {title || (lang === 'fr' ? 'Aperçu du Patient' : 'Patient Overview')}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Button 1: Add/Edit Consultation Info & Vitals */}
            <button
              type="button"
              onClick={handleOpenVitalsModal}
              className="px-2.5 py-1 bg-teal-950/80 hover:bg-teal-900 text-teal-300 hover:text-teal-200 text-xs font-semibold rounded-xl border border-teal-800/80 flex items-center gap-1.5 transition shadow-sm"
              title={lang === 'fr' ? 'Saisir ou modifier les signes vitaux et notes de consultation' : 'Record or update clinical vitals and consultation notes'}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === 'fr' ? '+ Vitaux / Consult' : '+ Vitals / Consult'}</span>
            </button>

            {/* Button 2: Edit Patient Demographics & Profile */}
            {onEditPatient && (
              <button
                type="button"
                onClick={() => onEditPatient(p)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition shadow-sm"
                title={lang === 'fr' ? 'Modifier les informations du patient' : 'Edit patient information'}
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'fr' ? 'Modifier Patient' : 'Edit Patient'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Demographics Summary List */}
        <div className="space-y-2.5 text-xs text-slate-300">
          {(p.codeBarre || p.CODE_BARRE || p.mrn) && (
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">{lang === 'fr' ? 'N° Dossier' : 'MRN / Barcode'}</span>
              <span className="font-mono text-xs text-teal-300 font-bold">{p.codeBarre || p.CODE_BARRE || p.mrn}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">{lang === 'fr' ? 'Groupe Sanguin' : 'Blood Group'}</span>
            <span className="font-bold text-teal-300 font-mono text-sm">{p.bloodGroup || 'N/A'}</span>
          </div>
          {p.assurance && (
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">{lang === 'fr' ? 'Assurance' : 'Insurance'}</span>
              <span className="font-semibold text-slate-200">{p.assurance}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">{lang === 'fr' ? 'Profession' : 'Profession'}</span>
            <span className="font-semibold text-slate-200">{p.profession || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">{lang === 'fr' ? 'Adresse' : 'Address'}</span>
            <span className="font-semibold text-slate-200 truncate max-w-[170px]">{p.address || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">{lang === 'fr' ? 'Téléphone' : 'Contact Phone'}</span>
            <span className="font-semibold text-slate-200">{p.phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-300 truncate max-w-[170px]">{p.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Signes Vitaux Cliniques */}
      <div className="pt-2 border-t border-slate-800/80">
        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-white">
            <Activity className="w-3.5 h-3.5 text-teal-400" /> {lang === 'fr' ? 'Signes Vitaux Cliniques' : 'Current Clinical Vitals'}
          </span>
          <span className="text-[10px] text-slate-500 font-normal">{lastUpdatedVal}</span>
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{lang === 'fr' ? 'Tension Artérielle' : 'Blood Pressure'}</span>
            <span className="text-sm font-extrabold text-teal-300 font-mono">{bpVal}</span>
          </div>
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{lang === 'fr' ? 'Fréquence Cardiaque' : 'Heart Rate'}</span>
            <span className="text-sm font-extrabold text-cyan-300 font-mono">{hrVal}</span>
          </div>
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{lang === 'fr' ? 'Saturation O2 (SpO2)' : 'Oxygen Sat (SpO2)'}</span>
            <span className="text-sm font-extrabold text-emerald-300 font-mono">{spo2Val}</span>
          </div>
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{lang === 'fr' ? 'Glycémie' : 'Blood Glucose'}</span>
            <span className="text-sm font-extrabold text-amber-300 font-mono">{bgVal}</span>
          </div>
        </div>
      </div>

      {/* Allergies Alert */}
      <div>
        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> {lang === 'fr' ? 'Allergies Connues' : 'Known Allergies'}
        </h4>
        {allergyList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {allergyList.map((allergy, i) => (
              <span key={i} className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" /> {allergy}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">{lang === 'fr' ? 'Aucune allergie connue.' : 'No known drug allergies reported.'}</span>
        )}
      </div>

      {/* Diagnostique Général */}
      <div>
        <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-2 flex items-center gap-1.5">
          <TestTube className="w-3.5 h-3.5 text-indigo-400" />
          {lang === 'fr' ? 'Diagnostique Général' : 'General Diagnosis'}
        </h4>
        {generalDiag ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 px-2.5 py-1 rounded-lg font-medium leading-relaxed max-w-full break-words">
              {generalDiag}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">
            {lang === 'fr' ? 'Aucun diagnostic général enregistré.' : 'No general diagnosis recorded.'}
          </span>
        )}
      </div>

      {/* Antécédents Personnels & Pathologies */}
      <div>
        <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Antécédents Personnels & Pathologies' : 'Personal Antecedents & Conditions'}
        </h4>
        {personalItems.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {personalItems.map((cond, i) => (
              <span key={i} className="text-xs bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-lg font-medium">
                {cond}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">{lang === 'fr' ? 'Aucun antécédent personnel enregistré.' : 'No personal antecedents recorded.'}</span>
        )}
      </div>

      {/* Antécédents Familiaux */}
      <div>
        <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-2">
          {lang === 'fr' ? 'Antécédents Familiaux' : 'Family Antecedents'}
        </h4>
        {familyList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {familyList.map((fam, i) => (
              <span key={i} className="text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 px-2.5 py-1 rounded-lg font-medium">
                {fam}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">
            {lang === 'fr' ? 'Aucun antécédent familial enregistré.' : 'No family antecedents recorded.'}
          </span>
        )}
      </div>

      {/* Dernier Diagnostic Consultation */}
      {(() => {
        const safeDiag = Array.isArray(patientDiagConsults) ? patientDiagConsults : [];
        const latestDiag = safeDiag.length > 0 ? safeDiag[0] : null;
        const diagText = latestDiag?.diagnosis || (diagList.length > 0 ? diagList[diagList.length - 1] : '');
        const diagDate = latestDiag?.date || '';
        return (
          <div>
            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-2 flex items-center justify-between">
              <span>{lang === 'fr' ? 'Dernier Diagnostic Consultation' : 'Latest Consultation Diagnosis'}</span>
              {diagDate && (
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">{diagDate}</span>
              )}
            </h4>
            {diagText ? (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg font-medium leading-relaxed max-w-full break-words font-semibold">
                  {diagText}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                {lang === 'fr' ? 'Aucun diagnostic enregistré.' : 'No key diagnostics recorded.'}
              </span>
            )}
          </div>
        );
      })()}

      {/* Dernière Observation Clinique */}
      {(() => {
        const safeObs = Array.isArray(patientObservations) ? patientObservations : [];
        return (
          <div>
            <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-wider mb-2 flex items-center justify-between">
              <span>{lang === 'fr' ? 'Dernière Observation Clinique' : 'Latest Clinical Observation'}</span>
              {safeObs.length > 0 && safeObs[0] && (
                <span className="text-[10px] text-cyan-400 font-mono font-semibold">{safeObs[0].date}</span>
              )}
            </h4>
            {safeObs.length > 0 && safeObs[0] ? (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-2.5 py-1 rounded-lg font-medium leading-relaxed max-w-full break-words">
                  {safeObs[0].observation}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                {lang === 'fr' ? 'Aucune observation enregistrée.' : 'No observations recorded.'}
              </span>
            )}
          </div>
        );
      })()}

      {/* Quick Edit Vitals & Consultation Info Modal */}
      {isEditingVitalsModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 w-full max-w-[calc(100vw-3rem)] space-y-4 shadow-2xl relative select-none max-h-[98vh] overflow-y-auto mx-3 sm:mx-6 lg:mx-8">
            {/* Modal Title Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                {lang === 'fr' ? 'Saisie des Signes Vitaux & Consultation' : 'Record Vitals & Consultation Notes'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingVitalsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 10 View Selector Tabs Under Title (Modelled EXACTLY after Consultation Screen docTabs) */}
            <div className="glass-panel p-2.5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {visibleTabs.map((btn) => {
                  const BtnIcon = btn.icon;
                  const isSelected = activeTab === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setActiveTab(btn.id)}
                      className={`flex-1 min-w-[115px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${isSelected
                          ? `bg-gradient-to-r ${btn.color} text-slate-950 border-teal-300 shadow-md shadow-teal-500/20 scale-[1.02]`
                          : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <BtnIcon className={`w-4 h-4 ${isSelected ? 'text-slate-950 font-bold' : 'text-teal-400'}`} />
                      <span className="truncate">{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              {activeTab === 'observation' && (
                <ObservationTab
                  lang={lang}
                  editComplaint={editComplaint} setEditComplaint={setEditComplaint}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingObservations={loadingObservations}
                  patientObservations={patientObservations}
                  onDeleteObservation={handleDeleteObservation}
                />
              )}
              {activeTab === 'antecedent' && (
                <AntecedentsTab
                  lang={lang}
                  newPersonalInput={newPersonalInput} setNewPersonalInput={setNewPersonalInput}
                  showPersonalDropdown={showPersonalDropdown} setShowPersonalDropdown={setShowPersonalDropdown}
                  handleAddPersonalAntecedent={handleAddPersonalAntecedent}
                  personalDbSuggestions={personalDbSuggestions}
                  personalListState={personalListState}
                  handleDeletePersonalAntecedent={handleDeletePersonalAntecedent}
                  
                  newFamilyInput={newFamilyInput} setNewFamilyInput={setNewFamilyInput}
                  showFamilyDropdown={showFamilyDropdown} setShowFamilyDropdown={setShowFamilyDropdown}
                  handleAddFamilyAntecedent={handleAddFamilyAntecedent}
                  familyDbSuggestions={familyDbSuggestions}
                  familyListState={familyListState}
                  handleDeleteFamilyAntecedent={handleDeleteFamilyAntecedent}
                  
                  newAllergyInput={newAllergyInput} setNewAllergyInput={setNewAllergyInput}
                  showAllergyDropdown={showAllergyDropdown} setShowAllergyDropdown={setShowAllergyDropdown}
                  handleAddAllergy={handleAddAllergy}
                  allergyDbSuggestions={allergyDbSuggestions}
                  allergyListState={allergyListState}
                  handleDeleteAllergy={handleDeleteAllergy}
                />
              )}
              {activeTab === 'taBattement' && (
                <VitalsTab
                  lang={lang}
                  editBP={editBP} setEditBP={setEditBP}
                  editHR={editHR} setEditHR={setEditHR}
                  editO2={editO2} setEditO2={setEditO2}
                  editGlucose={editGlucose} setEditGlucose={setEditGlucose}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingVitalsHistory={loadingVitalsHistory}
                  vitalsHistory={vitalsHistory}
                  onDeleteVitals={handleDeleteVitals}
                />
              )}
              {activeTab === 'mensurations' && (
                <MeasurementsTab
                  lang={lang}
                  editTaille={editTaille} setEditTaille={setEditTaille}
                  editPoids={editPoids} setEditPoids={setEditPoids}
                  editPerimCran={editPerimCran} setEditPerimCran={setEditPerimCran}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingHeights={loadingHeights}
                  loadingWeights={loadingWeights}
                  loadingHeadCircs={loadingHeadCircs}
                  combinedMensurationsHistory={combinedMensurationsHistory}
                  onDeleteHeight={handleDeleteHeight}
                  onDeleteWeight={handleDeleteWeight}
                  onDeleteHeadCirc={handleDeleteHeadCirc}
                />
              )}
              {activeTab === 'alimentation' && (
                <DietTab
                  lang={lang} t={t}
                  editAlimentation={editAlimentation} setEditAlimentation={setEditAlimentation}
                  isSaving={isSaving} onSave={handleSaveVitals}
                />
              )}
              {activeTab === 'ddrDpa' && (
                <ObstetricsTab
                  lang={lang}
                  editDDR={editDDR} setEditDDR={setEditDDR}
                  editDPA={editDPA} setEditDPA={setEditDPA}
                  isSaving={isSaving} onSave={handleSaveVitals}
                />
              )}
              {activeTab === 'diagConsult' && (
                <ConsultDiagnosisTab
                  lang={lang}
                  editDiagConsult={editDiagConsult} setEditDiagConsult={setEditDiagConsult}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingDiagConsults={loadingDiagConsults}
                  patientDiagConsults={patientDiagConsults}
                  onDeleteDiagConsult={handleDeleteDiagConsult}
                />
              )}
              {activeTab === 'explorConsult' && (
                <GeneralDiagnosisTab
                  lang={lang} t={t}
                  editExplorConsult={editExplorConsult} setEditExplorConsult={setEditExplorConsult}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingNutritions={loadingNutritions}
                  patientNutritions={patientNutritions}
                  onDeleteNutrition={handleDeleteNutrition}
                />
              )}
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}