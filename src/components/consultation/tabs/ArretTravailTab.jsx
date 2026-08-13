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


export default function ArretTravailTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
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
    </div>
  );
}
