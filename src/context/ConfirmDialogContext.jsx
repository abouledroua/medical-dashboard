import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'danger',
    resolve: null
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Confirmation',
        message: options.message || 'Êtes-vous sûr de vouloir effectuer cette action ?',
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        variant: options.variant || 'danger',
        resolve
      });
    });
  }, []);

  const handleConfirm = () => {
    if (dialogState.resolve) dialogState.resolve(true);
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  };

  const handleCancel = () => {
    if (dialogState.resolve) dialogState.resolve(false);
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    // Fallback if rendered outside provider
    return (options = {}) => Promise.resolve(window.confirm(options.message || 'Confirmer ?'));
  }
  return context;
}
