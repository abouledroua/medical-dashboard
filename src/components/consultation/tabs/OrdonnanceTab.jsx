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


export default function OrdonnanceTab() {
  const context = useConsultation();
  const { lang, activeDocType, setActiveDocType, prescriptionMode, setPrescriptionMode, freeTextPrescription, setFreeTextPrescription, inputMedRef, inputFormeRef, inputDosageRef, inputFreqRef, inputDurationRef, newRxName, setNewRxName, newRxForme, setNewRxForme, selectedFormeId, setSelectedFormeId, newRxDosage, setNewRxDosage, newRxFrequency, setNewRxFrequency, newRxDuration, setNewRxDuration, showFormeDropdown, setShowFormeDropdown, focusedFormeIdx, setFocusedFormeIdx, selectedMedId, setSelectedMedId, medDbSuggestions, setMedDbSuggestions, showMedDropdown, setShowMedDropdown, focusedSuggestionIdx, setFocusedSuggestionIdx, dosageSuggestions, setDosageSuggestions, showDosageDropdown, setShowDosageDropdown, focusedDosageIdx, setFocusedDosageIdx, freqSuggestions, setFreqSuggestions, showFreqDropdown, setShowFreqDropdown, focusedFreqIdx, setFocusedFreqIdx, durationSuggestions, setDurationSuggestions, showDurationDropdown, setShowDurationDropdown, focusedDurationIdx, setFocusedDurationIdx, freeTextSuggestions, setFreeTextSuggestions, showFreeTextDropdown, setShowFreeTextDropdown, focusedFreeTextIdx, setFocusedFreeTextIdx, getDefaultAssureInfo, getPatientDisplayAge, assureInfo, setAssureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp, showPastPrescriptionsModal, setShowPastPrescriptionsModal, pastConsultationsList, setPastConsultationsList, loadingPastPrescriptions, setLoadingPastPrescriptions, showReplaceConfirmModal, setShowReplaceConfirmModal, pendingRxToLoad, setPendingRxToLoad, prescriptions, setPrescriptions, certificat, setCertificat, bilanMode, setBilanMode, bilanCocheRows, setBilanCocheRows, loadingBilanCoche, setLoadingBilanCoche, showBilanModal, setShowBilanModal, editingBilanIndex, setEditingBilanIndex, bilanSearch, setBilanSearch, selectedBilans, setSelectedBilans, buildBilanDesignation, parseDesignationToSelected, handleOpenBilanAddOrEdit, bilan, setBilan, saisieError, setSaisieError, fetchBilanCocheHistory, handleAddFreeTextBilan, formatDateToLocale, handleDeleteBilan, orientation, setOrientation, arretTravail, setArretTravail, arretHistory, setArretHistory, loadingArretHistory, setLoadingArretHistory, savingArret, setSavingArret, arretSaveStatus, setArretSaveStatus, fetchArretHistory, handleDeleteArret, numberToWords, docMedical, setDocMedical, availableMotifs, setAvailableMotifs, patientHistoricalMotifs, setPatientHistoricalMotifs, selectedMotifs, setSelectedMotifs, currentMotifSelection, setCurrentMotifSelection, nextAppointment, setNextAppointment, isBookingAppt, setIsBookingAppt, apptBookingStatus, setApptBookingStatus, doctor, setDoctor, department, setDepartment, loading, setLoading, error, setError, savedSuccessMessage, setSavedSuccessMessage, fullPatientDetails, setFullPatientDetails, notifyDraftUpdate, handleOpenPastPrescriptions, handleLoadPastPrescription, applyPrescriptionLoad, handleMergePrescriptionLoad, handlePrintPrescription, handlePrintBilan, formatDateToFrench, handleSaveArret, handlePrintArret, handleBookNextApptNow, handleCancel, quickMedications, setQuickMedications, fetchDosageSuggestionsForMed, fetchFrequencySuggestionsForMed, fetchDurationSuggestions, fetchFreeTextSuggestions, fetchFormeForMed, dbFormeSuggestions, setDbFormeSuggestions, fetchFormeSuggestionsFromDb, resolveMedAndFormeIds, handleSelectMedSuggestion, handleSelectFormeSuggestion, handleSelectDosageSuggestion, handleSelectFrequencySuggestion, syncPrescriptionsToBackend, handleAssureInfoChange, handleAddMedicationFromForm, handleAddPrescriptionFromForm, handleAddEmptyRxRow, handleAddRxRow, handleRemoveRxRow, handleRxChange, toggleBioExam, toggleImgExam, calculateEndDate, calculateReturnDate, handleSubmit, clinicInfo, draft, patient, activePatient } = context;
  // Fallback if not everything is used
  const t = (key) => key;

  return (
    <div className="tab-content">
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
    </div>
  );
}
