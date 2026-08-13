import React from 'react';
import { useConsultation } from '../../context/ConsultationContext';
import { 
  X, History, Edit3, Calendar, Check, Download,
  CheckCircle2, AlertTriangle, FileText, Plus, Search, ChevronRight
} from 'lucide-react';
import ReplacePrescriptionModal from '../consultation/ReplacePrescriptionModal';

export default function ConsultationModals() {
  const context = useConsultation();
  const {
    showPastPrescriptionsModal, setShowPastPrescriptionsModal,
    showReplaceConfirmModal, setShowReplaceConfirmModal,
    showBilanModal, setShowBilanModal,
    lang, loadingPastPrescriptions, pastConsultationsList,
    applyPrescriptionLoad, handleMergePrescriptionLoad,
    pendingRxToLoad,
    bilanMode, setBilanMode, bilanSearch, setBilanSearch,
    bilanCocheRows, loadingBilanCoche, selectedBilans, setSelectedBilans,
    editingBilanIndex, parseDesignationToSelected, buildBilanDesignation,
    activePatient, fetchBilanCocheHistory, bilan, setBilan, notifyDraftUpdate
  } = context;

  // Needed for "Valider la modification"
  const t = (key) => key;
  
  return (
    <>
      
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
    </>
  );
}
