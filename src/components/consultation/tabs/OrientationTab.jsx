import React from 'react';
import { useConsultation } from '../../../context/ConsultationContext';
import { 
  Pill, FileCheck, TestTube, Compass, CalendarOff, FileText, 
  Stethoscope, User, AlertTriangle, Activity, Heart, Clock, Plus, 
  Trash2, Save, Printer, ChevronRight, CheckCircle2, ShieldAlert, 
  Sparkles, Building2, Phone, MapPin, BadgeInfo, Calendar, Layers, 
  Check, FileCheck2, UserCheck, Edit3, History, Download, RefreshCw, 
  ListChecks, Search, X, CheckSquare, Square
} from 'lucide-react';


export default function OrientationTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
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
    </div>
  );
}
