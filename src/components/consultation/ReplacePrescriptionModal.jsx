import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ReplacePrescriptionModal({
  isOpen,
  lang = 'fr',
  onCancel,
  onMerge,
  onReplace
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {lang === 'fr' ? 'Remplacer l\'Ordonnance en Cours ?' : 'Replace Current Prescription?'}
            </h3>
            <p className="text-xs text-amber-300/80 font-medium">
              {lang === 'fr' ? 'La table de médicaments contient déjà des éléments.' : 'The medication list already contains items.'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
          {lang === 'fr'
            ? 'Êtes-vous sûr de vouloir remplacer la liste actuelle de médicaments par les éléments de cette ancienne ordonnance ?'
            : 'Are you sure you want to replace the current medication list with this past prescription?'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          
          <button
            type="button"
            onClick={onMerge}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 transition cursor-pointer"
          >
            {lang === 'fr' ? 'Ajouter à la suite' : 'Append items'}
          </button>

          <button
            type="button"
            onClick={onReplace}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            {lang === 'fr' ? 'Oui, Remplacer' : 'Yes, Replace'}
          </button>
        </div>
      </div>
    </div>
  );
}
