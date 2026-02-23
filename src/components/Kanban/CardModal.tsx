'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Save, Trash2, X } from 'lucide-react';

import { kanbanApi } from '@/lib/kanbanApi';
import { stackAuth } from '@/lib/stack-auth';
import { Card as CardType, CardComment } from '@/types';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface CardModalProps {
  card: CardType;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
}

const dueDateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

const toDateInputValue = (value: string | undefined) => {
  if (!value) return '';

  if (dueDateInputPattern.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CardModal: React.FC<CardModalProps> = ({ card, onClose, onRefresh }) => {
  const user = stackAuth.useUser();
  const currentSpace = stackAuth.useCurrentSpace();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [assignedUserId, setAssignedUserId] = useState(card.assignedUserId ?? '');
  const [dueDate, setDueDate] = useState(toDateInputValue(card.dueDate));
  const [comments, setComments] = useState<CardComment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const canSubmitComment = useMemo(() => commentContent.trim().length > 0, [commentContent]);

  const loadComments = async () => {
    if (!currentSpace) return;

    setIsLoadingComments(true);
    try {
      const data = await kanbanApi.getCardComments(card.id, currentSpace.id);
      setComments(data);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [card.id, currentSpace?.id]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleteConfirmOpen) onClose();
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose, isDeleteConfirmOpen]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);
    try {
      await kanbanApi.updateCard({
        id: card.id,
        title: trimmedTitle,
        description,
        assignedUserId: assignedUserId || null,
        dueDate: dueDate || null,
      });
      await onRefresh();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await kanbanApi.deleteCard(card.id);
      await onRefresh();
      setIsDeleteConfirmOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateComment = async () => {
    if (!user || !currentSpace || !canSubmitComment) return;

    setIsCommenting(true);
    try {
      const created = await kanbanApi.createCardComment(card.id, {
        tenantId: currentSpace.id,
        authorUserId: user.id,
        authorName: user.name,
        content: commentContent.trim(),
      });
      setComments(prev => [...prev, created]);
      setCommentContent('');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-[60vw] h-[80vh] min-w-[320px] max-w-[96vw] overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col">
        <div className="h-14 px-5 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-700">Detalhes do Card</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título</label>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="mt-2 w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Adicione detalhes, critérios e contexto do card..."
              className="mt-2 w-full min-h-[200px] border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
              <select
                value={assignedUserId}
                onChange={event => setAssignedUserId(event.target.value)}
                className="mt-2 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem responsável</option>
                {(currentSpace?.members ?? []).map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data estimada</label>
              <input
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
                className="mt-2 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <MessageSquare className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Comentários</h3>
            </div>

            <div className="space-y-2">
              <textarea
                value={commentContent}
                onChange={event => setCommentContent(event.target.value)}
                placeholder="Escreva um comentário..."
                className="w-full min-h-24 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <button
                onClick={handleCreateComment}
                disabled={!canSubmitComment || isCommenting}
                className="bg-slate-900 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {isCommenting ? 'Publicando...' : 'Comentar'}
              </button>
            </div>

            <div className="space-y-3 max-h-[30vh] overflow-y-auto overflow-x-hidden pr-1">
              {isLoadingComments && (
                <p className="text-xs text-slate-400">Carregando comentários...</p>
              )}

              {!isLoadingComments && comments.length === 0 && (
                <p className="text-xs text-slate-400">Nenhum comentário ainda.</p>
              )}

              {comments.map(comment => (
                <div key={comment.id} className="border rounded-xl p-3 bg-slate-50 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-xs font-semibold text-slate-700">{comment.authorName}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-16 px-5 border-t flex items-center justify-end gap-2 flex-shrink-0 bg-white">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            Excluir card
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Excluir card"
        description="Deseja realmente excluir este card?"
        confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir card'}
        tone="danger"
        isConfirming={isDeleting}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CardModal;
