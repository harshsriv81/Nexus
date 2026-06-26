import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal portal with backdrop blur + scale animation.
 * Click outside or press Escape to close.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4
                 bg-void/80 backdrop-blur-glass animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={`relative w-full ${maxWidth} glass rounded-3xl shadow-float animate-scale-in overflow-hidden`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-faint">
            <h3 className="font-bold text-text-bright text-lg tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center
                         text-text-muted hover:text-text-primary hover:bg-white/10
                         transition-all duration-150"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
