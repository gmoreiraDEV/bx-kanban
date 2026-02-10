'use client'


import React, { useEffect, useMemo, useState } from 'react';

import Modal from '@/components/ui/Modal';

interface TextInputModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  cancelLabel?: string;
  initialValue?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void> | void;
}

const TextInputModal: React.FC<TextInputModalProps> = ({
  isOpen,
  title,
  description,
  label,
  placeholder,
  submitLabel,
  cancelLabel = 'Cancelar',
  initialValue = '',
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const trimmedValue = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (!isOpen) return;
    setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedValue || isSubmitting) return;
    await onSubmit(trimmedValue);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
          <input
            value={value}
            onChange={event => setValue(event.target.value)}
            placeholder={placeholder}
            autoFocus
            className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!trimmedValue || isSubmitting}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TextInputModal;
