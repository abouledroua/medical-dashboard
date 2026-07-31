import React, { useState, useEffect } from 'react';
import { Laptop, Check, ShieldAlert, AlertCircle } from 'lucide-react';
import { translations } from '../translations';

export default function DeviceNameModal({ isOpen, onSave, currentDeviceId, lang = 'fr' }) {
  const [deviceName, setDeviceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = translations[lang] || translations.fr;

  useEffect(() => {
    if (isOpen) {
      setDeviceName('');
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = deviceName.trim();
    if (!trimmed) {
      setError(lang === 'fr' ? 'Veuillez saisir le nom du poste avant de valider.' : 'Please enter a device name before saving.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSave(trimmed);
    } catch (err) {
      console.error('Error saving device name:', err);
      setError(lang === 'fr' ? 'Échec de l\'enregistrement.' : 'Failed to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header (No close button - mandatory identification) */}
        <div className="p-6 border-b border-slate-800/80 flex items-start gap-4">
          <div className="p-3 bg-teal-950/80 border border-teal-800/60 rounded-xl text-teal-400 shrink-0">
            <Laptop className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {lang === 'fr' ? 'Identification Obligatoire du Poste' : 'Mandatory Device Identification'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {lang === 'fr'
                ? `Ce poste (${currentDeviceId || 'Inconnu'}) n'est pas encore enregistré. Veuillez saisir un nom pour valider l'accès.`
                : `This device (${currentDeviceId || 'Unknown'}) is not registered. Please enter a name to validate access.`}
            </p>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {lang === 'fr' ? 'Nom du poste / Appareil *' : 'Device Name *'}
            </label>
            <input
              type="text"
              autoFocus
              value={deviceName}
              onChange={(e) => {
                setDeviceName(e.target.value);
                if (error) setError('');
              }}
              placeholder={lang === 'fr' ? 'ex: Poste 01 - Accueil, Bureau Docteur...' : 'e.g. Reception Desk, Doctor Room 1...'}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              {lang === 'fr' 
                ? 'Saisissez le nom de ce poste pour valider et enregistrer.' 
                : 'Enter the device name to validate and save.'}
            </p>
          </div>

          {/* Footer Button (Only Validate button - mandatory) */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !deviceName.trim()}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === 'fr' ? 'Valider et enregistrer' : 'Validate & Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
