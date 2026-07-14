import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';

const PopupContext = createContext(null);

const popupThemes = {
  success: {
    icon: CheckCircle2,
    badgeClass: 'bg-secondary-fixed/30 text-secondary',
    buttonClass: 'bg-primary text-on-primary hover:opacity-90',
    secondaryButtonClass: 'border-primary-container text-primary hover:bg-primary-container/10',
    accentClass: 'text-secondary',
    glowClass: 'bg-secondary-fixed/20',
  },
  error: {
    icon: ShieldAlert,
    badgeClass: 'bg-error-container/40 text-error',
    buttonClass: 'bg-primary text-on-primary hover:opacity-90',
    secondaryButtonClass: 'border-outline-variant text-on-surface hover:bg-surface-variant',
    accentClass: 'text-error',
    glowClass: 'bg-error-container/50',
  },
  warning: {
    icon: AlertTriangle,
    badgeClass: 'bg-error-container/30 text-error',
    buttonClass: 'bg-primary text-on-primary hover:opacity-90',
    secondaryButtonClass: 'border-outline-variant text-on-surface hover:bg-surface-variant',
    accentClass: 'text-error',
    glowClass: 'bg-error-container/45',
  },
  info: {
    icon: Info,
    badgeClass: 'bg-primary-fixed/30 text-primary',
    buttonClass: 'bg-primary text-on-primary hover:opacity-90',
    secondaryButtonClass: 'border-primary-container text-primary hover:bg-primary-container/10',
    accentClass: 'text-primary',
    glowClass: 'bg-primary-fixed/25',
  },
};

const normalizePopup = (options = {}) => {
  const kind = options.kind || 'info';
  const theme = popupThemes[kind] || popupThemes.info;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind,
    title: options.title || 'Notice',
    message: options.message || '',
    details: Array.isArray(options.details) ? options.details.filter(Boolean) : [],
    confirmText: options.confirmText || 'Okay',
    cancelText: options.cancelText || 'Cancel',
    dismissible: options.dismissible ?? true,
    requireExplicitAction: options.requireExplicitAction ?? false,
    theme,
    resolve: options.resolve,
  };
};

const PopupBox = ({ popup, onConfirm, onCancel }) => {
  const panelRef = useRef(null);
  const Icon = popup.theme.icon;

  useEffect(() => {
    panelRef.current?.focus();
  }, [popup.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && popup.dismissible) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, popup.dismissible]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-surface/75 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-variant/30 to-surface-container/50" />
        <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-secondary-fixed/20 blur-3xl opacity-60" />
        <div className={`absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full blur-3xl opacity-60 ${popup.theme.glowClass}`} />
      </div>

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-popup-title"
        aria-describedby="global-popup-message"
        className="relative z-10 flex w-full max-w-[480px] flex-col items-center rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-[0_24px_60px_rgb(0,0,0,0.15)] outline-none sm:p-10"
      >
        {popup.dismissible && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full p-2 text-outline transition-colors hover:bg-surface-variant hover:text-on-surface"
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
        )}

        <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${popup.theme.badgeClass}`}>
          <Icon size={30} strokeWidth={2.2} />
        </div>

        <div className="w-full">
          <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] ${popup.theme.accentClass}`}>
            {popup.kind === 'success'
              ? 'Success'
              : popup.kind === 'error'
                ? 'Attention'
                : popup.kind === 'warning'
                  ? 'Warning'
                  : 'Information'}
          </p>
          <h2 id="global-popup-title" className="mb-2 text-[1.75rem] font-semibold tracking-tight text-on-surface">
            {popup.title}
          </h2>
          <p id="global-popup-message" className="mx-auto mb-8 max-w-[28rem] text-sm leading-7 text-on-surface-variant">
            {popup.message}
          </p>

          {popup.details.length > 0 && (
            <div className="mb-8 rounded-[22px] border border-outline-variant/20 bg-surface-container p-4 text-left">
              <div className="space-y-2.5">
                {popup.details.map((detail) => (
                  <div key={detail} className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${popup.theme.accentClass.replace('text-', 'bg-')}`} />
                    <p className="text-sm leading-6 text-on-surface-variant">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
            {popup.requireExplicitAction && (
              <button
                type="button"
                onClick={onCancel}
                className={`w-full rounded-full border-[1.5px] px-8 py-3 text-sm font-semibold transition-colors sm:w-auto ${popup.theme.secondaryButtonClass}`}
              >
                {popup.cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full rounded-full px-8 py-3 text-sm font-semibold shadow-sm transition-colors sm:w-auto ${popup.theme.buttonClass}`}
            >
              {popup.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PopupProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);

  const closeCurrent = useCallback((result) => {
    setQueue((current) => {
      if (current.length === 0) return current;

      const [active, ...rest] = current;
      active.resolve?.(result);
      return rest;
    });
  }, []);

  const show = useCallback((options) => new Promise((resolve) => {
    setQueue((current) => [...current, normalizePopup({ ...options, resolve })]);
  }), []);

  const api = useMemo(() => ({
    show,
    info: (message, options = {}) => show({ ...options, kind: 'info', message }),
    success: (message, options = {}) => show({ ...options, kind: 'success', message }),
    warning: (message, options = {}) => show({ ...options, kind: 'warning', message }),
    error: (message, options = {}) => show({ ...options, kind: 'error', message }),
    confirm: (options = {}) => show({
      ...options,
      kind: options.kind || 'warning',
      requireExplicitAction: true,
      dismissible: options.dismissible ?? true,
    }),
  }), [show]);

  const activePopup = queue[0] || null;

  return (
    <PopupContext.Provider value={api}>
      {children}
      {activePopup && (
        <PopupBox
          popup={activePopup}
          onConfirm={() => closeCurrent(true)}
          onCancel={() => closeCurrent(false)}
        />
      )}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const value = useContext(PopupContext);

  if (!value) {
    throw new Error('usePopup must be used inside PopupProvider');
  }

  return value;
};
