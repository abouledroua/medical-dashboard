import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2, X, Check } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirmation',
  message = 'Voulez-vous vraiment effectuer cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
  lang = 'fr'
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-rose-950/80 text-rose-400 border-rose-800/80 shadow-rose-900/30',
          btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
          borderAccent: 'border-t-4 border-t-rose-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-950/80 text-amber-400 border-amber-800/80 shadow-amber-900/30',
          btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/30',
          borderAccent: 'border-t-4 border-t-amber-500'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-teal-950/80 text-teal-400 border-teal-800/80 shadow-teal-900/30',
          btnBg: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/30',
          borderAccent: 'border-t-4 border-t-teal-500'
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click backdrop to cancel */}
      <div className="absolute inset-0" onClick={onCancel} />

      <div
        className={`relative w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel ${styles.borderAccent} animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close X */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border shadow-lg ${styles.iconBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="px-6 py-4 text-sm text-slate-300 leading-relaxed font-medium">
          {message}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-950/50 border-t border-slate-800/80">
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg transition cursor-pointer active:scale-95 ${styles.btnBg}`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
