import React from 'react';
import { ConsultationProvider, useConsultation } from '../context/ConsultationContext';
import ConsultationHeader from './consultation/ConsultationHeader';
import ConsultationSidebarTabs from './consultation/ConsultationSidebarTabs';
import OrdonnanceTab from './consultation/tabs/OrdonnanceTab';
import CertificatTab from './consultation/tabs/CertificatTab';
import BilanTab from './consultation/tabs/BilanTab';
import OrientationTab from './consultation/tabs/OrientationTab';
import ArretTravailTab from './consultation/tabs/ArretTravailTab';
import DocMedicalTab from './consultation/tabs/DocMedicalTab';
import ProchainRdvTab from './consultation/tabs/ProchainRdvTab';
import ConsultationModals from './consultation/ConsultationModals';
import PatientOverviewPanel from './PatientOverviewPanel';
import { Edit3, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

function ConsultationContent() {
  const {
    lang, activeDocType, clinicInfo, savedSuccessMessage, error,
    assureInfo, showAssurePanel, setShowAssurePanel, showInfoSupp, setShowInfoSupp,
    handleAssureInfoChange, activePatient, fullPatientDetails,
    onEditPatient, onOpenNewConsultation
  } = useConsultation();

  return (
    <div className="w-full space-y-5 select-none">
      {/* Top Header: Title + Patient Info + Save/Cancel Buttons */}
      <ConsultationHeader />

      {/* Document Type Selector Tabs — full-width toolbar below header */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 bg-slate-950/80">
        <ConsultationSidebarTabs />
      </div>

      {/* Error / Success Banners */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {savedSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{savedSuccessMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN: Patient Vitals / Overview Panel */}
        <div className="lg:col-span-4 space-y-4">
          <PatientOverviewPanel
            patient={fullPatientDetails || activePatient}
            onEditPatient={onEditPatient}
            onOpenNewConsultation={onOpenNewConsultation}
            lang={lang}
            clinicInfo={clinicInfo}
          />
        </div>

        {/* RIGHT COLUMN: Active Document */}
        <div className="lg:col-span-8 space-y-4">

          {/* Assure / Insured Person Panel (only when GEST_ASSURE is enabled) */}
          {Number(clinicInfo?.GEST_ASSURE) === 1 && activeDocType !== 'doc_medical' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0">
                    <Edit3 className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {lang === 'fr' ? "Détails de l'Assuré" : 'Insured Person Details'}
                      {assureInfo.infoSupp && (
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          {lang === 'fr' ? 'Info Supp.' : 'Add. Info'}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>
                        <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Nom :' : 'Name:'}</strong>{' '}
                        <span className="font-semibold text-white">{assureInfo.fullname || '—'}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Âge :' : 'Age:'}</strong>{' '}
                        <span className="font-semibold text-teal-300">{assureInfo.age || '—'} {assureInfo.typeAge || 'ans'}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Sexe :' : 'Sex:'}</strong>{' '}
                        <span className="font-semibold text-cyan-300">{assureInfo.sexe || 'M'}</span>
                      </span>
                      {assureInfo.infoSupp && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>
                            <strong className="text-slate-400 font-normal">{lang === 'fr' ? 'Info Supp :' : 'Add. Info:'}</strong>{' '}
                            <span className="font-semibold text-amber-300">{assureInfo.infoSupp}</span>
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInfoSupp(!showInfoSupp)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                      showInfoSupp || (assureInfo.infoSupp && assureInfo.infoSupp.trim())
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'fr' ? 'Info Supp.' : 'Add. Info'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssurePanel(!showAssurePanel)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{showAssurePanel ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? "Modifier l'Assuré" : 'Edit Insured Details')}</span>
                  </button>
                </div>
              </div>

              {(showAssurePanel || showInfoSupp) && (
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      {lang === 'fr' ? 'Nom & Prénom (Full Name)' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={assureInfo.fullname || ''}
                      onChange={(e) => handleAssureInfoChange({ ...assureInfo, fullname: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition"
                      placeholder={lang === 'fr' ? "Nom et prénom de l'assuré..." : 'Full name...'}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        {lang === 'fr' ? 'Âge' : 'Age'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={assureInfo.age || ''}
                        onChange={(e) => handleAssureInfoChange({ ...assureInfo, age: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-teal-300 font-semibold focus:outline-none focus:border-teal-500 transition"
                        placeholder={lang === 'fr' ? 'ex: 30' : 'e.g. 30'}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        {lang === 'fr' ? 'Unité' : 'Unit'}
                      </label>
                      <select
                        value={assureInfo.typeAge || 'ans'}
                        onChange={(e) => handleAssureInfoChange({ ...assureInfo, typeAge: e.target.value })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition"
                      >
                        <option value="ans">{lang === 'fr' ? 'Ans' : 'Years'}</option>
                        <option value="mois">{lang === 'fr' ? 'Mois' : 'Months'}</option>
                        <option value="jours">{lang === 'fr' ? 'Jours' : 'Days'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      {lang === 'fr' ? 'Sexe' : 'Sex'}
                    </label>
                    <select
                      value={assureInfo.sexe || 'M'}
                      onChange={(e) => handleAssureInfoChange({ ...assureInfo, sexe: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 transition"
                    >
                      <option value="M">{lang === 'fr' ? 'Masculin' : 'Male'}</option>
                      <option value="F">{lang === 'fr' ? 'Féminin' : 'Female'}</option>
                    </select>
                  </div>
                  <div className="col-span-full pt-2 border-t border-slate-800/60">
                    <label className="block text-[10px] font-bold text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-amber-400" />
                      {lang === 'fr' ? 'Information Supplémentaire (INFO_SUP)' : 'Additional Information'}
                    </label>
                    <input
                      type="text"
                      value={assureInfo.infoSupp || ''}
                      onChange={(e) => handleAssureInfoChange({ ...assureInfo, infoSupp: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-200 focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600 font-mono"
                      placeholder={lang === 'fr' ? 'Saisir une information supplémentaire...' : 'Enter additional information...'}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Document Content Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 min-h-[460px] bg-slate-900/90">
            {activeDocType === 'ordonnance' && <OrdonnanceTab />}
            {activeDocType === 'certificat' && <CertificatTab />}
            {activeDocType === 'bilan' && <BilanTab />}
            {activeDocType === 'orientation' && <OrientationTab />}
            {activeDocType === 'arret_travail' && <ArretTravailTab />}
            {activeDocType === 'doc_medical' && <DocMedicalTab />}
            {activeDocType === 'prochain_rdv' && <ProchainRdvTab />}
          </div>

        </div>{/* end RIGHT COLUMN */}
      </div>{/* end 2-column grid */}

      <ConsultationModals />
    </div>
  );
}

export default function AddConsultationModal(props) {
  return (
    <ConsultationProvider {...props}>
      <ConsultationContent />
    </ConsultationProvider>
  );
}
