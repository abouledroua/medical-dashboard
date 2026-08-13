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


export default function ProchainRdvTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
            
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
</div>
  );
}
