import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintSettingsTab({
  t,
  formData,
  handleChange,
  typePapierRdv,
  setTypePapierRdv
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
        <Printer className="w-4 h-4 text-teal-400" />
        {t.printSectionTitle}
      </h3>
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printOrdonnanceLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_ORD" value="1" checked={String(formData?.IMPR_ORD ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORD', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printOrdonnanceA4}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_ORD" value="2" checked={String(formData?.IMPR_ORD ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORD', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printOrdonnanceHalf}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printArretLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_ARRET" value="1" checked={String(formData?.IMPR_ARRET ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_ARRET', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printArretA5}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_ARRET" value="2" checked={String(formData?.IMPR_ARRET ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_ARRET', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printArretA4}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printOrdHeaderLabel}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((model) => (
              <label key={model} className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                <input type="radio" name="MODELE_ORD" value={model} checked={String(formData?.MODELE_ORD ?? '1') === String(model)} onChange={(e) => handleChange({ target: { name: 'MODELE_ORD', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
                {`Modèle ${model}`}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printOrientationLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_ORIENTATION" value="1" checked={String(formData?.IMPR_ORIENTATION ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORIENTATION', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printArretA5}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_ORIENTATION" value="2" checked={String(formData?.IMPR_ORIENTATION ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_ORIENTATION', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printArretA4}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printPaperLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_PAPIER_PRE_IMPRIME" value="1" checked={String(formData?.IMPR_PAPIER_PRE_IMPRIME ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_PAPIER_PRE_IMPRIME', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printPaperBlank}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_PAPIER_PRE_IMPRIME" value="2" checked={String(formData?.IMPR_PAPIER_PRE_IMPRIME ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_PAPIER_PRE_IMPRIME', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printPaperPrePrinted}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printBottomPageLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="BAS_PAGE" value="1" checked={String(formData?.BAS_PAGE ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'BAS_PAGE', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printBottomMessage}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="BAS_PAGE" value="2" checked={String(formData?.BAS_PAGE ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'BAS_PAGE', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printBottomContact}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printRdvPaperLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="TypePapierRDV" value="1" checked={String(typePapierRdv) === '1'} onChange={(e) => { setTypePapierRdv(e.target.value); localStorage.setItem('clinicTypePapierRdv', e.target.value); }} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printRdvA5}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="TypePapierRDV" value="2" checked={String(typePapierRdv) === '2'} onChange={(e) => { setTypePapierRdv(e.target.value); localStorage.setItem('clinicTypePapierRdv', e.target.value); }} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printRdvTicket}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="TypePapierRDV" value="3" checked={String(typePapierRdv) === '3'} onChange={(e) => { setTypePapierRdv(e.target.value); localStorage.setItem('clinicTypePapierRdv', e.target.value); }} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printRdvA4}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printBilanLabel}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_BILAN" value="1" checked={String(formData?.IMPR_BILAN ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'IMPR_BILAN', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printBilanA5}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="IMPR_BILAN" value="2" checked={String(formData?.IMPR_BILAN ?? '1') === '2'} onChange={(e) => handleChange({ target: { name: 'IMPR_BILAN', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.printBilanA4}
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">{t.printBarcodeLabel || 'Imprimer Code Barre'}</h4>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="Affiche_CodeBarre" value="1" checked={String(formData?.Affiche_CodeBarre ?? '1') === '1'} onChange={(e) => handleChange({ target: { name: 'Affiche_CodeBarre', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.yesOption || 'Oui'}
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
            <input type="radio" name="Affiche_CodeBarre" value="2" checked={String(formData?.Affiche_CodeBarre) === '0' || String(formData?.Affiche_CodeBarre) === '2'} onChange={(e) => handleChange({ target: { name: 'Affiche_CodeBarre', value: e.target.value, type: 'radio' } })} className="w-4 h-4 text-teal-500 bg-slate-900 border-slate-700" />
            {t.noOption || 'Non'}
          </label>
        </div>
      </div>
    </div>
  );
}
