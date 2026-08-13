import React from 'react';
import { User, Phone, Building2, Sliders } from 'lucide-react';

export default function GeneralInfoTab({
  lang,
  t,
  formData,
  handleChange,
  handleArabicFocus,
  handleArabicBlur
}) {
  return (
    <>
      {/* 1. Identification Médicale */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <User className="w-4 h-4 text-teal-400" />
          {t.sectionPhysicianIdentity}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.nomCabinetLabel}</label>
            <input
              type="text"
              name="nomCabinet"
              value={formData?.nomCabinet || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'ex: Cabinet Médical EL IYADA' : 'e.g. EL IYADA Medical Practice'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.doctorNameFrLabel}</label>
            <input
              type="text"
              name="doctorNameFr"
              value={formData?.doctorNameFr || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'ex: Dr. BENALI Mohamed' : 'e.g. Dr. BENALI Mohamed'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.doctorNameArLabel}</label>
            <input
              type="text"
              name="doctorNameAr"
              value={formData?.doctorNameAr || ''}
              onChange={handleChange}
              onFocus={handleArabicFocus}
              onBlur={handleArabicBlur}
              placeholder="د. بن علي محمد"
              dir="rtl"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.specialtyFrLabel}</label>
            <textarea
              name="specialtyFr"
              value={formData?.specialtyFr || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'ex: Spécialiste en ORL et Chirurgie Cervico-Faciale' : 'e.g. ENT & Head and Neck Surgery Specialist'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.specialtyArLabel}</label>
            <textarea
              name="specialtyAr"
              value={formData?.specialtyAr || ''}
              onChange={handleChange}
              onFocus={handleArabicFocus}
              onBlur={handleArabicBlur}
              placeholder="مختص في أمراض الأنف والأذن والحنجرة"
              dir="rtl"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.detailsSpecialiteLabel}</label>
            <input
              type="text"
              name="detailsSpecialite"
              value={formData?.detailsSpecialite || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'ex: Explorations Fonctionnelles & Audiologie' : 'e.g. Functional Explorations & Audiology'}
              dir="auto"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.orderNumberLabel}</label>
            <input
              type="text"
              name="ordre"
              value={formData?.ordre || ''}
              onChange={handleChange}
              placeholder="ex: 23/14589"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
            />
          </div>
        </div>
      </div>
      
      {/* 2. Coordonnées et Contacts */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Phone className="w-4 h-4 text-teal-400" />
          {t.sectionContact}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.mobilePhoneLabel}</label>
            <input
              type="text"
              name="phone"
              value={formData?.phone || ''}
              onChange={handleChange}
              placeholder="0661000000"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.landlinePhoneLabel}</label>
            <input
              type="text"
              name="fixe"
              value={formData?.fixe || ''}
              onChange={handleChange}
              placeholder="038000000"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.proEmailLabel}</label>
            <input
              type="email"
              name="email"
              value={formData?.email || ''}
              onChange={handleChange}
              placeholder="contact@iyada.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.facebookPageLabel}</label>
            <input
              type="text"
              name="facebookPage"
              value={formData?.facebookPage || ''}
              onChange={handleChange}
              placeholder="facebook.com/drbenali"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.websiteLabel}</label>
            <input
              type="text"
              name="website"
              value={formData?.website || ''}
              onChange={handleChange}
              placeholder="www.drbenali.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>
        </div>
      </div>

      {/* 3. Adresse & Localisation */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Building2 className="w-4 h-4 text-teal-400" />
          {t.sectionLocation}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.addressFrLabel}</label>
            <textarea
              name="addressFr"
              value={formData?.addressFr || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'ex: Cité 1000 Logements, Annaba' : 'e.g. 1000 Housing Estate, Annaba'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.addressArLabel}</label>
            <textarea
              name="addressAr"
              value={formData?.addressAr || ''}
              onChange={handleChange}
              onFocus={handleArabicFocus}
              onBlur={handleArabicBlur}
              placeholder="حي 1000 مسكن عنابة"
              dir="rtl"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition text-right"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.cityLabel}</label>
            <input
              type="text"
              name="city"
              value={formData?.city || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'ex: Annaba' : 'e.g. Annaba'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            />
          </div>
        </div>
      </div>
      
      {/* 4. Messages d'Impression */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-teal-400" />
          {t.sectionPrescriptions}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.prescriptionSloganLabel}</label>
            <textarea
              name="msgOrd"
              value={formData?.msgOrd || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'Slogan ou message en haut des ordonnances...' : 'Top prescription slogan or message...'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.messageJauneLabel}</label>
            <textarea
              name="msgJaune"
              value={formData?.msgJaune || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'Avertissement ou note d\'attention...' : 'Warning notice or note...'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">{t.messageClotureLabel}</label>
            <textarea
              name="msgCloture"
              value={formData?.msgCloture || ''}
              onChange={handleChange}
              placeholder={lang === 'fr' ? 'Message de fin d\'ordonnance ou de salutation...' : 'End of prescription message or closing...'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
              rows={3}
            />
          </div>
        </div>
      </div>
    </>
  );
}
