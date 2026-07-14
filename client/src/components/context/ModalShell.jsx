import React from 'react';
import { X } from 'lucide-react';

const ModalShell = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  contentClassName = '',
  bodyClassName = '',
  hideClose = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
      />

      <div
        className={`relative flex max-h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.24)] ${contentClassName}`}
      >
        {(title || subtitle || !hideClose) && (
          <div className="flex items-start justify-between gap-6 border-b border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,250,255,0.92))] px-6 py-5 sm:px-8">
            <div className="min-w-0">
              {title && (
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {subtitle}
                </p>
              )}
            </div>

            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-white text-slate-400 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
};

export default ModalShell;
