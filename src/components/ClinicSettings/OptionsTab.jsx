import React from 'react';
import { Sliders } from 'lucide-react';

export default function OptionsTab({
  t,
  lang,
  formData,
  setFormData,
  handleChange,
  handleSave,
  debounceTimeout
}) {
  const handleCheckboxChange = (e, key) => {
    const newFormData = {
      ...formData,
      [key]: e.target.checked ? 1 : 0
    };
    setFormData(newFormData);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      handleSave(newFormData);
    }, 1500);
  };

  const vitalOptions = [
    { key: 'OBS', labelFr: 'Observation', labelEn: 'Observation' },
    { key: 'ANT', labelFr: 'Antécédent', labelEn: 'Antecedents' },
    { key: 'TA', labelFr: 'TA & Battement', labelEn: 'BP & HR' },
    { key: 'TAILLE', labelFr: 'Taille', labelEn: 'Height' },
    { key: 'POIDS', labelFr: 'Poids', labelEn: 'Weight' },
    { key: 'PC', labelFr: 'Périmètre Crânien', labelEn: 'Head Circumference' },
    { key: 'ALIMENTATION', labelFr: 'Alimentation', labelEn: 'Nutrition' },
    { key: 'DDR', labelFr: 'DDR && DPA', labelEn: 'LMP && EDD' },
    { key: 'DIAG_CONS', labelFr: 'Diagnostic Consultation', labelEn: 'Consultation Diagnosis' },
    { key: 'DIAG_G', labelFr: 'Diagnostique Général', labelEn: 'General Diagnosis' },
  ];

  return (
    <div className="space-y-6">
      {/* Option disponible dans la consultation Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-teal-400" />
          {t.consultationOptionsTitle}
        </h3>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 w-48">
            <input type="checkbox" id="ord" checked={formData?.ORD === 1} onChange={(e) => handleCheckboxChange(e, 'ORD')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="ord" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.ordonnanceLabel}</label>
          </div>
          <div className="flex items-center gap-3 w-48">
            <input type="checkbox" id="cert_medic" checked={formData?.CERT_MEDIC === 1} onChange={(e) => handleCheckboxChange(e, 'CERT_MEDIC')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="cert_medic" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.certMedicLabel}</label>
          </div>
          <div className="flex items-center gap-3 w-48">
            <input type="checkbox" id="bilan" checked={formData?.BILAN === 1} onChange={(e) => handleCheckboxChange(e, 'BILAN')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="bilan" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.bilanLabel}</label>
          </div>
          <div className="flex items-center gap-3 w-48">
            <input type="checkbox" id="let_or" checked={formData?.LET_OR === 1} onChange={(e) => handleCheckboxChange(e, 'LET_OR')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="let_or" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.letOrLabel}</label>
          </div>
          <div className="flex items-center gap-3 w-48">
            <input type="checkbox" id="arret_trav" checked={formData?.ARRET_TRAV === 1} onChange={(e) => handleCheckboxChange(e, 'ARRET_TRAV')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="arret_trav" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.arretTravLabel}</label>
          </div>
          <div className="flex items-center gap-3 w-48">
            <input type="checkbox" id="motif" checked={formData?.MOTIF === 1} onChange={(e) => handleCheckboxChange(e, 'MOTIF')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="motif" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.documentMedicLabel}</label>
          </div>
        </div>
      </div>

      {/* Option disponible dans les Informations Vitaux Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-teal-400" />
          {lang === 'fr' ? 'Option disponible dans les Informations Vitaux' : 'Options available in Vitals Information'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vitalOptions.map((item) => {
            const isChecked = Number(formData?.paramInfoSupp?.[item.key] ?? 1) === 1;
            return (
              <div key={item.key} className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  id={`vital_opt_${item.key}`}
                  checked={isChecked}
                  onChange={(e) => {
                    const updatedInfoSupp = {
                      OBS: 1, ANT: 1, TA: 1, TAILLE: 1, POIDS: 1, PC: 1, ALIMENTATION: 1, DDR: 1, DIAG_CONS: 1, DIAG_G: 1,
                      ...(formData?.paramInfoSupp || {}),
                      [item.key]: e.target.checked ? 1 : 0
                    };
                    const newFormData = { ...formData, paramInfoSupp: updatedInfoSupp };
                    setFormData(newFormData);
                    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
                    debounceTimeout.current = setTimeout(() => handleSave(newFormData), 1500);
                  }}
                  className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
                <label htmlFor={`vital_opt_${item.key}`} className="text-xs font-semibold text-slate-200 cursor-pointer">
                  {lang === 'fr' ? item.labelFr : item.labelEn}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activation des Options Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-teal-400" />
          {t.activationOptionsTitle}
        </h3>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="gest_rdv" checked={formData?.GEST_RDV === 1} onChange={(e) => handleCheckboxChange(e, 'GEST_RDV')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="gest_rdv" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.gestRdvLabel}</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="resume_dern_cons" checked={formData?.RESUME_DERN_CONS === 1} onChange={(e) => handleCheckboxChange(e, 'RESUME_DERN_CONS')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="resume_dern_cons" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.resumeDernConsLabel}</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="gest_image" checked={formData?.GEST_IMAGE === 1} onChange={(e) => handleCheckboxChange(e, 'GEST_IMAGE')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="gest_image" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.gestImageLabel}</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="apercu" checked={formData?.APERCU === 1} onChange={(e) => handleCheckboxChange(e, 'APERCU')} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 rounded cursor-pointer" />
            <label htmlFor="apercu" className="text-sm font-semibold text-slate-200 cursor-pointer">{t.apercuLabel}</label>
          </div>
        </div>
      </div>

      {/* Gestion des Options Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-teal-400" />
          {t.optionsManagementTitle}
        </h3>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">{t.gestOrdonnancesLabel}</label>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-3">
              <input type="radio" name="GEST_ORDONNANCE" value="1" checked={formData?.GEST_ORDONNANCE === 1} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.gestOrdSelection}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="radio" name="GEST_ORDONNANCE" value="2" checked={formData?.GEST_ORDONNANCE === 2} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.gestOrdPrescription}</label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">{t.gestBilansLabel}</label>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-3">
              <input type="radio" name="GEST_BILAN" value="1" checked={formData?.GEST_BILAN === 1} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.gestBilanSaisie}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="radio" name="GEST_BILAN" value="2" checked={formData?.GEST_BILAN === 2} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.gestBilanCase}</label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">{t.freqMedicamentLabel}</label>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-3">
              <input type="radio" name="FREQ_MEDIC" value="1" checked={formData?.FREQ_MEDIC === 1} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.freqMedicLettre}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="radio" name="FREQ_MEDIC" value="2" checked={formData?.FREQ_MEDIC === 2} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.freqMedicChiffre}</label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">{t.motifRdvLabel}</label>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-3">
              <input type="radio" name="MOTIF_RDV" value="1" checked={formData?.MOTIF_RDV === 1} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.motifRdvSelection}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="radio" name="MOTIF_RDV" value="2" checked={formData?.MOTIF_RDV === 2} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.motifRdvSaisie}</label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">{t.numRdvLabel}</label>
          <div className="space-y-2 ml-4">
            <div className="flex items-center gap-3">
              <input type="radio" name="NUM_RDV" value="1" checked={formData?.NUM_RDV === 1} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.numRdvContinu}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="radio" name="NUM_RDV" value="2" checked={formData?.NUM_RDV === 2} onChange={handleChange} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700 cursor-pointer" />
              <label className="text-sm text-slate-300 cursor-pointer">{t.numRdvJournalier}</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
