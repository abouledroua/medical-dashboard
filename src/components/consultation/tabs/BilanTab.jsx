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


export default function BilanTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
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
    </div>
  );
}
