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


export default function DocMedicalTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
                  {activeDocType === 'doc_medical' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-400" />
                      {lang === 'fr' ? 'Documents Médicaux' : 'Medical Documents'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'fr' ? 'Sélectionnez et ajoutez des modèles de documents médicaux pour ce patient.' : 'Select and add medical document templates for this patient.'}
                    </p>
                  </div>
                </div>

                {/* Motif Selection */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      {lang === 'fr' ? 'Modèle de Document' : 'Document Template'}
                    </label>
                    <select
                      value={currentMotifSelection}
                      onChange={(e) => setCurrentMotifSelection(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-950 text-slate-100 border border-slate-700 rounded-lg focus:border-teal-500 outline-none"
                    >
                      <option value="">{lang === 'fr' ? '-- Sélectionner un modèle --' : '-- Select a template --'}</option>
                      {availableMotifs.map(m => (
                        <option key={m.ID_MOTIF} value={m.ID_MOTIF}>
                          {m.DESIGNATION}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentMotifSelection) return;
                      const mId = parseInt(currentMotifSelection, 10);
                      if (!selectedMotifs.includes(mId)) {
                        const newSelected = [...selectedMotifs, mId];
                        setSelectedMotifs(newSelected);
                        notifyDraftUpdate({ selectedMotifs: newSelected });
                      }
                      setCurrentMotifSelection("");
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition shadow flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {lang === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>

                {/* Table of Motifs */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">
                    {lang === 'fr' ? 'Historique & Documents de la séance' : 'History & Session Documents'}
                  </h4>
                  <div className="overflow-hidden border border-slate-700/50 rounded-xl bg-slate-950/40">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-900/80 border-b border-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-300 w-24">Date</th>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-300">Designation</th>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-300 w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {/* New Selections */}
                        {selectedMotifs.map(id => {
                          const motif = availableMotifs.find(m => m.ID_MOTIF === id);
                          if (!motif) return null;
                          return (
                            <tr key={`new-${id}`} className="hover:bg-slate-800/30 transition bg-teal-900/10">
                              <td className="px-3 py-2 text-xs text-teal-300">{lang === 'fr' ? "Aujourd'hui" : 'Today'}</td>
                              <td className="px-3 py-2 text-slate-200">{motif.DESIGNATION}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSelected = selectedMotifs.filter(mId => mId !== id);
                                    setSelectedMotifs(newSelected);
                                    notifyDraftUpdate({ selectedMotifs: newSelected });
                                  }}
                                  className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded transition"
                                  title="Retirer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Historical Motifs */}
                        {patientHistoricalMotifs.map((hm, idx) => (
                          <tr key={`hist-${idx}`} className="hover:bg-slate-800/30 transition">
                            <td className="px-3 py-2 text-xs text-slate-400">{hm.date}</td>
                            <td className="px-3 py-2 text-slate-300">{hm.designation}</td>
                            <td className="px-3 py-2 text-center">
                              {hm.chemin ? (
                                <a
                                  href={`/api/motif/download/${encodeURIComponent(hm.designation)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 inline-flex text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition"
                                  title="Ouvrir Modèle"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {selectedMotifs.length === 0 && patientHistoricalMotifs.length === 0 && (
                          <tr>
                            <td colSpan="3" className="px-3 py-4 text-center text-xs text-slate-500 italic">
                              {lang === 'fr' ? 'Aucun document trouvé pour ce patient.' : 'No documents found for this patient.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 7. DYNAMIC PANEL: PROCHAIN RENDEZ-VOUS (Follow-up Appointment Scheduling) */}
    </div>
  );
}
