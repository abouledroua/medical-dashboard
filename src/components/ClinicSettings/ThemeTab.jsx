import React from 'react';
import { Palette, CheckCircle2 } from 'lucide-react';

export default function ThemeTab({ lang, currentTheme, onThemeChange }) {
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
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-teal-400" />
              {lang === 'fr' ? 'Thèmes Visuels du Tableau de Bord' : 'Dashboard Visual Themes'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'fr' ? 'Sélectionnez un thème visuel parmi les 6 options proposées (3 thèmes sombres et 3 thèmes clairs).' : 'Select a visual theme from 6 available options (3 dark themes and 3 light themes).'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {themesList.map((tItem) => {
            const isActive = currentTheme === tItem.id || (currentTheme === 'dark' && tItem.id === 'dark-emerald') || (currentTheme === 'light' && tItem.id === 'light-medical');
            return (
              <div
                key={tItem.id}
                onClick={() => onThemeChange && onThemeChange(tItem.id)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-44 overflow-hidden group ${
                  isActive
                    ? 'border-teal-400 ring-2 ring-teal-400/40 shadow-xl scale-[1.02]'
                    : 'border-slate-800 hover:border-slate-600 hover:scale-[1.01]'
                }`}
                style={{ background: tItem.bgPreview }}
              >
                <div className="flex items-center justify-between z-10">
                  <span className="text-sm font-bold tracking-tight" style={{ color: tItem.textPreview }}>
                    {tItem.name}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${tItem.badgeStyle}`}>
                    {tItem.mode === 'dark' ? (lang === 'fr' ? 'Sombre' : 'Dark') : (lang === 'fr' ? 'Clair' : 'Light')}
                  </span>
                </div>

                <div className="my-2 space-y-2 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg shadow-sm" style={{ background: tItem.accentColor }} />
                    <div className="h-2 rounded-full flex-1" style={{ background: tItem.cardPreview, border: `1px solid ${tItem.borderPreview}` }} />
                  </div>
                  <div className="h-2.5 rounded-md w-3/4 opacity-80" style={{ background: tItem.textPreview }} />
                  <div className="h-2 rounded-md w-1/2 opacity-50" style={{ background: tItem.textPreview }} />
                </div>

                <div className="flex items-center justify-between z-10 pt-2 border-t" style={{ borderColor: tItem.borderPreview }}>
                  <span className="text-[11px] font-medium opacity-80" style={{ color: tItem.textPreview }}>
                    {tItem.desc}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-xs font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'fr' ? 'Actif' : 'Active'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
