import React from 'react';
import { Image } from 'lucide-react';

export default function ImagesLogoTab({
  t,
  logo,
  header,
  badge,
  setLogo,
  setHeader,
  setBadge,
  handleImageChange
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
        <Image className="w-4 h-4 text-teal-400" />
        {t.sectionImagesLogo}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center gap-4">
          <label className="block text-sm font-semibold text-teal-300 mb-2">{t.logoLabel}</label>
          <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Image className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-xs text-slate-400">Cliquez pour ajouter</p></div>}
            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setLogo, 'clinicLogo')} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          {logo && <button type="button" onClick={() => { setLogo(null); localStorage.removeItem('clinicLogo'); }} className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>}
        </div>
        <div className="flex flex-col items-center gap-4">
          <label className="block text-sm font-semibold text-teal-300 mb-2">{t.headerLabel}</label>
          <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
            {header ? <img src={header} alt="Entête Ordonnance" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Image className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-xs text-slate-400">Cliquez pour ajouter</p></div>}
            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setHeader, 'clinicHeader')} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          {header && <button type="button" onClick={() => { setHeader(null); localStorage.removeItem('clinicHeader'); }} className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>}
        </div>
        <div className="flex flex-col items-center gap-4">
          <label className="block text-sm font-semibold text-teal-300 mb-2">{t.badgeLabel}</label>
          <div className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-teal-500 transition overflow-hidden bg-slate-900/50 flex items-center justify-center cursor-pointer group">
            {badge ? <img src={badge} alt="Image Verso Badge" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Image className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-xs text-slate-400">Cliquez pour ajouter</p></div>}
            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBadge, 'clinicBadge')} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          {badge && <button type="button" onClick={() => { setBadge(null); localStorage.removeItem('clinicBadge'); }} className="text-xs text-red-400 hover:text-red-300 transition">Supprimer</button>}
        </div>
      </div>
    </div>
  );
}
