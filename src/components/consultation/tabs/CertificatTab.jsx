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


export default function CertificatTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
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
    </div>
  );
}
