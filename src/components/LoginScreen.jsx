import React, { useState, useEffect } from 'react';
import { Activity, User, Lock, Eye, EyeOff, ShieldCheck, Stethoscope, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { translations } from '../translations';

export default function LoginScreen({ onLogin, lang = 'fr', setLang }) {
  const t = translations[lang] || translations.fr;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const medicalParagraphs = t.medicalParagraphs;

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Increase rotation interval to 12 seconds with smooth fade
  useEffect(() => {
    setQuoteIndex(0);
    setFade(true);
  }, [lang]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % medicalParagraphs.length);
        setFade(true);
      }, 1000);
    }, 12000);
    return () => clearInterval(interval);
  }, [medicalParagraphs.length]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setError(t.userRequired || 'Veuillez saisir votre nom d\'utilisateur.');
      return;
    }
    if (!password) {
      setError(t.passRequired || 'Veuillez saisir votre mot de passe.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nom d\'utilisateur ou mot de passe incorrect.');
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        onLogin(data.user);
      } else {
        setError('Réponse invalide du serveur.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Login request error:', err);
      setError('Impossible de se connecter au serveur backend MySQL.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows & Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>


      <div className="w-full max-w-md z-10 my-auto">
        {/* Top Bar with Language Selector */}
        <div className="flex justify-center mb-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-full shadow-lg backdrop-blur-md">
                <Globe className="w-4 h-4 text-teal-400 ml-2 mr-1" />
                <button
                    onClick={() => setLang && setLang('fr')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${lang === 'fr'
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <span>🇫🇷</span> FR
                </button>
                <button
                    onClick={() => setLang && setLang('en')}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${lang === 'en'
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <span>🇬🇧</span> EN
                </button>
            </div>
        </div>
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border border-teal-500/40 shadow-xl shadow-teal-500/25 mb-4 p-0.5 bg-slate-900">
            <img src="/el_iyada_logo.png" alt="EL IYADA Icon" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            EL <span className="text-teal-400">IYADA</span>
          </h1>

          {/* Slow Animated Medical Paragraph (12s rotation) */}
          <div className="min-h-[56px] flex items-center justify-center mt-2.5 px-3">
            <p className={`text-xs sm:text-sm text-teal-200/90 font-medium max-w-sm mx-auto leading-relaxed italic transition-all duration-1000 ease-in-out ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
              "{medicalParagraphs[quoteIndex]}"
            </p>
          </div>
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent mx-auto mt-3 rounded-full animate-pulse"></div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-2xl shadow-slate-950/80">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                {t.staffSignIn}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.signInSubtitle}</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold text-teal-300 bg-teal-950/80 border border-teal-800/60 rounded-full">
              {t.secureNotice}
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">{t.authWarningTitle}</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.usernameLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {t.passwordLabel}
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0"
                />
                <span>{t.rememberSession}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.authenticating}</span>
                </>
              ) : (
                <>
                  <span>{t.signInBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Stethoscope className="w-3.5 h-3.5 text-teal-500/70" />
          <span>{t.hipaaNotice}</span>
        </div>
      </div>
    </div>
  );
}
