import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, Calendar as CalendarIcon, LogOut, Globe, MoonStar, SunMedium, Clock3, RotateCw, Laptop } from 'lucide-react';
import { translations } from '../translations';

export default function Header({ searchQuery, setSearchQuery, onSelectTab, activeTab, currentUser, onLogout, lang = 'fr', setLang, clinicInfo, theme = 'dark', setTheme, onRefreshData, deviceId, deviceName }) {
  const t = translations[lang] || translations.fr;
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  const currentDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const displayedDeviceText = (deviceName !== null && deviceName !== undefined && deviceName.trim() !== '') 
    ? deviceName 
    : deviceId;

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-teal-500/30 shadow-lg shadow-teal-500/20 bg-slate-900 flex items-center justify-center">
          <img src="/el_iyada_logo.png" alt="EL IYADA Icon" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">EL <span className="text-teal-400">IYADA</span></h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {lang === 'fr' ? 'Synchro Multi-PC' : 'Multi-PC Sync'}
            </span>
            {(displayedDeviceText || deviceId) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900/90 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-mono font-bold tracking-wide shadow-sm" title={lang === 'fr' ? 'Nom / Identifiant du Poste' : 'Device Name / ID'}>
                <Laptop className="w-3 h-3 text-teal-400" />
                {displayedDeviceText}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {clinicInfo?.doctorNameFr 
              ? `${clinicInfo.doctorNameFr} • ${clinicInfo.addressFr || clinicInfo.city || 'Cabinet ORL'}` 
              : t.subtitle}
          </p>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (activeTab !== 'patients') {
              onSelectTab('patients');
            }
          }}
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/90 text-slate-100 border border-slate-700/70 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-slate-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
          >
            {t.clearSearch}
          </button>
        )}
      </div>

      {/* Controls & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Language Switcher Button */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg">
          <Globe className="w-3.5 h-3.5 text-teal-400 ml-1.5 mr-0.5" />
          <button
            onClick={() => setLang && setLang('fr')}
            className={`px-2 py-1 text-xs font-bold rounded transition-all ${
              lang === 'fr'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLang && setLang('en')}
            className={`px-2 py-1 text-xs font-bold rounded transition-all ${
              lang === 'en'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        <div className="hidden sm:flex flex-col items-start gap-1 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-teal-400" />
            <span>{currentDate}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-teal-300 font-medium">
            <Clock3 className="w-3.5 h-3.5 text-teal-300" />
            <span>{currentTime}</span>
          </div>
        </div>



        {/* Manual Data Sync Button */}
        {onRefreshData && (
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              await onRefreshData();
              setTimeout(() => setIsSyncing(false), 500);
            }}
            title={lang === 'fr' ? 'Synchroniser les données en direct' : 'Sync live data with server'}
            className="p-2 text-slate-300 hover:text-teal-300 bg-slate-900/60 hover:bg-teal-950/30 rounded-lg border border-slate-800 hover:border-teal-500/40 transition flex items-center gap-1.5 text-xs"
          >
            <RotateCw className={`w-4 h-4 text-teal-400 ${isSyncing ? 'animate-spin text-teal-300' : ''}`} />
            <span className="hidden xl:inline font-semibold">{lang === 'fr' ? 'Synchro' : 'Sync'}</span>
          </button>
        )}

        <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

        {/* Doctor Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600 to-teal-700 flex items-center justify-center font-bold text-sm text-white border border-teal-400/30 shadow-md">
            {currentUser?.initials || (currentUser?.name ? currentUser.name.charAt(0) : '')}
          </div>
          <div className="hidden lg:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">{currentUser?.name || ''}</span>
              {currentUser?.name && <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />}
            </div>
            <span className="text-[11px] text-slate-400 block">{currentUser?.role || ''}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title={t.signOut}
              className="p-2 ml-1 text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-950/40 rounded-lg border border-slate-800 hover:border-rose-800/60 transition flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline font-medium">{t.signOut}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
