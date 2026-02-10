'use client'


import React from 'react';

import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  hideCancel?: boolean;
  tone?: 'default' | 'danger';
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
  hideCancel = false,
  tone = 'default',
  onClose,
  onConfirm,
}) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isConfirming) return;
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} title={title} description={description} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex items-center justify-end gap-2">
        {!hideCancel && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={isConfirming}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            tone === 'danger'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {isConfirming ? 'Processando...' : confirmLabel}
        </button>
      </form>
    </Modal>
  );
};

export default ConfirmModal;
