import React, { useState, useEffect } from 'react';
import { Laptop, Check, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations } from '../translations';

export default function DeviceNameModal({ isOpen, onSave, currentDeviceId, lang = 'fr' }) {
  const [deviceName, setDeviceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('dark-emerald');
  const [workspacePath, setWorkspacePath] = useState(() => localStorage.getItem('clinicWorkspacePath') || '');

  const t = translations[lang] || translations.fr;

  useEffect(() => {
    if (isOpen) {
      setDeviceName('');
      setIsSubmitting(false);
      setError('');
      const savedTheme = localStorage.getItem('el_iyada_theme') || 'dark-emerald';
      setSelectedTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
      setWorkspacePath(localStorage.getItem('clinicWorkspacePath') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    document.documentElement.dataset.theme = themeId;
    localStorage.setItem('el_iyada_theme', themeId);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = deviceName.trim();
    const trimmedPath = workspacePath.trim();
    if (!trimmed) {
      setError(lang === 'fr' ? 'Veuillez saisir le nom du poste avant de valider.' : 'Please enter a device name before saving.');
      return;
    }
    if (!trimmedPath) {
      setError(lang === 'fr' ? 'Veuillez sélectionner un dossier de travail.' : 'Please select a workspace folder.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSave(trimmed, trimmedPath);
    } catch (err) {
      console.error('Error saving device name:', err);
      setError(lang === 'fr' ? 'Échec de l\'enregistrement.' : 'Failed to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const themesList = [
    {
      id: 'dark-emerald',
      name: 'Cyber Emerald',
      mode: 'dark',
      accentColor: '#14b8a6',
      bgPreview: '#070d1e',
      cardPreview: '#0f172a',
      textPreview: '#f8fafc',
      borderPreview: '#334155',
      badgeStyle: 'bg-teal-950 text-teal-300 border-teal-800',
      desc: lang === 'fr' ? 'Obsidienne & Émeraude Lumineuse' : 'Deep Obsidian & Cyber Teal'
    },
    {
      id: 'dark-violet',
      name: 'Violet Nebula',
      mode: 'dark',
      accentColor: '#a855f7',
      bgPreview: '#0d0a1a',
      cardPreview: '#18122b',
      textPreview: '#fae8ff',
      borderPreview: '#581c87',
      badgeStyle: 'bg-purple-950 text-purple-300 border-purple-800',
      desc: lang === 'fr' ? 'Midnight & Violet Électrique' : 'Cosmic Indigo & Violet Glow'
    },
    {
      id: 'dark-nordic',
      name: 'Nordic Ocean',
      mode: 'dark',
      accentColor: '#38bdf8',
      bgPreview: '#06152d',
      cardPreview: '#0f2240',
      textPreview: '#f0f9ff',
      borderPreview: '#0c4a6e',
      badgeStyle: 'bg-sky-950 text-sky-300 border-sky-800',
      desc: lang === 'fr' ? 'Bleu Arctique & Cyan Glacé' : 'Arctic Navy & Ice Cyan'
    },
    {
      id: 'light-medical',
      name: 'Crimson Red',
      mode: 'light',
      accentColor: '#e11d48',
      bgPreview: '#fff1f2',
      cardPreview: '#ffffff',
      textPreview: '#4c0519',
      borderPreview: '#fda4af',
      badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300',
      desc: lang === 'fr' ? 'Porcelaine Rose & Rouge Crimson' : 'Rose Porcelain & Crimson Red'
    },
    {
      id: 'light-amber',
      name: 'Onyx Slate',
      mode: 'light',
      accentColor: '#0f172a',
      bgPreview: '#f8fafc',
      cardPreview: '#ffffff',
      textPreview: '#020617',
      borderPreview: '#94a3b8',
      badgeStyle: 'bg-slate-900 text-white border-slate-700',
      desc: lang === 'fr' ? 'Porcelaine & Noir Onyx Monochromatique' : 'Monochrome Slate & Onyx Black'
    },
    {
      id: 'light-mint',
      name: 'Sage Botanical',
      mode: 'light',
      accentColor: '#059669',
      bgPreview: '#ecfdf5',
      cardPreview: '#f0fdf4',
      textPreview: '#064e3b',
      borderPreview: '#a7f3d0',
      badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      desc: lang === 'fr' ? 'Menthe & Émeraude Botanique' : 'Mint Sage & Forest Emerald'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
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
                ? `Ce poste (${currentDeviceId || 'Inconnu'}) n'est pas encore enregistré. Veuillez saisir un nom et choisir un thème pour valider l'accès.`
                : `This device (${currentDeviceId || 'Unknown'}) is not registered. Please enter a name and choose a theme to validate access.`}
            </p>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {lang === 'fr' ? 'Dossier de Travail (Workspace) *' : 'Workspace Folder *'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workspacePath}
                onChange={(e) => {
                  setWorkspacePath(e.target.value);
                  if (error) setError('');
                }}
                placeholder={lang === 'fr' ? 'Chemin du dossier...' : 'Folder path...'}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/select-folder');
                    if (res.ok) {
                      const data = await res.json();
                      if (data.path) {
                        setWorkspacePath(data.path);
                        if (error) setError('');
                      }
                    }
                  } catch (err) {
                    console.error("Failed to open folder picker", err);
                  }
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
                title={lang === 'fr' ? 'Sélectionner un dossier' : 'Select folder'}
                disabled={isSubmitting}
              >
                ...
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-3">
              {lang === 'fr' ? 'Thème visuel par défaut *' : 'Default Visual Theme *'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themesList.map((tItem) => {
                const isActive = selectedTheme === tItem.id;
                return (
                  <div
                    key={tItem.id}
                    onClick={() => handleThemeChange(tItem.id)}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 overflow-hidden group ${
                      isActive
                        ? 'border-teal-400 ring-2 ring-teal-400/40 shadow-lg'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    style={{ background: tItem.bgPreview }}
                  >
                    <div className="flex items-start justify-between z-10">
                      <span className="text-xs font-bold tracking-tight" style={{ color: tItem.textPreview }}>
                        {tItem.name}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded-full border ${tItem.badgeStyle}`}>
                        {tItem.mode === 'dark' ? (lang === 'fr' ? 'Sombre' : 'Dark') : (lang === 'fr' ? 'Clair' : 'Light')}
                      </span>
                    </div>

                    <div className="space-y-1.5 z-10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md shadow-sm" style={{ background: tItem.accentColor }} />
                        <div className="h-1.5 rounded-full flex-1" style={{ background: tItem.cardPreview, border: `1px solid ${tItem.borderPreview}` }} />
                      </div>
                      <div className="h-2 rounded-md w-3/4 opacity-80" style={{ background: tItem.textPreview }} />
                    </div>

                    {isActive && (
                      <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-teal-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>


          {/* Footer Button (Only Validate button - mandatory) */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-800 shrink-0">
            <button
              type="submit"
              disabled={isSubmitting || !deviceName.trim() || !workspacePath.trim()}
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
