'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  Table2,
} from 'lucide-react';

import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  onEditorStateJsonChange?: (stateJson: string) => void;
}

interface ToolbarAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface SlashAction {
  label: string;
  description: string;
  run: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Comece a escrever... Use / para comandos rápidos',
  minHeightClassName = 'min-h-[500px]',
  onEditorStateJsonChange,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastMarkdownRef = useRef('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState('');

  useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastMarkdownRef.current) return;

    editorRef.current.innerHTML = markdownToHtml(value, { disableCheckboxes: false });
    lastMarkdownRef.current = value;
  }, [value]);

  const syncEditorValue = () => {
    if (!editorRef.current) return;
    const markdown = htmlToMarkdown(editorRef.current.innerHTML);
    lastMarkdownRef.current = markdown;
    onChange(markdown);
    onEditorStateJsonChange?.(JSON.stringify({ html: editorRef.current.innerHTML }));
  };

  const runCommand = (command: string, commandValue?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    syncEditorValue();
  };

  const insertChecklist = () => {
    runCommand(
      'insertHTML',
      '<ul class="task-list"><li class="task-list-item"><input type="checkbox" /> <span>Nova tarefa</span></li></ul><p><br></p>'
    );
  };

  const insertTable = () => {
    runCommand(
      'insertHTML',
      '<table><thead><tr><th>Coluna 1</th><th>Coluna 2</th></tr></thead><tbody><tr><td>Valor 1</td><td>Valor 2</td></tr></tbody></table><p><br></p>'
    );
  };

  const slashActions = useMemo<SlashAction[]>(
    () => [
      { label: 'Título 1', description: 'Seção principal', run: () => runCommand('formatBlock', 'h1') },
      { label: 'Título 2', description: 'Subseção', run: () => runCommand('formatBlock', 'h2') },
      { label: 'Lista', description: 'Lista com marcadores', run: () => runCommand('insertUnorderedList') },
      { label: 'Lista numerada', description: 'Lista ordenada', run: () => runCommand('insertOrderedList') },
      { label: 'Checklist', description: 'Lista com checkbox', run: insertChecklist },
      { label: 'Citação', description: 'Bloco de citação', run: () => runCommand('formatBlock', 'blockquote') },
      { label: 'Código', description: 'Bloco de código', run: () => runCommand('formatBlock', 'pre') },
      { label: 'Tabela', description: 'Tabela 2x2', run: insertTable },
    ],
    []
  );

  const filteredSlashActions = useMemo(() => {
    const query = slashQuery.trim().toLowerCase();
    if (!query) return slashActions;
    return slashActions.filter(action => action.label.toLowerCase().includes(query));
  }, [slashActions, slashQuery]);

  const closeSlashMenu = () => {
    setShowSlashMenu(false);
    setSlashQuery('');
  };

  const removeSlashTextBeforeCommand = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;

    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = startContainer as Text;
      const text = textNode.textContent ?? '';
      const prefix = text.slice(0, range.startOffset);
      const slashMatch = prefix.match(/\/(\w*)$/);
      if (slashMatch) {
        const slashStart = range.startOffset - slashMatch[0].length;
        textNode.textContent = `${text.slice(0, slashStart)}${text.slice(range.startOffset)}`;
        const nextOffset = Math.max(0, slashStart);
        const nextRange = document.createRange();
        nextRange.setStart(textNode, Math.min(nextOffset, (textNode.textContent ?? '').length));
        nextRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      }
    }
  };

  const executeSlashAction = (action: SlashAction) => {
    removeSlashTextBeforeCommand();
    action.run();
    closeSlashMenu();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = event => {
    const isModifier = event.metaKey || event.ctrlKey;

    if (isModifier && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      runCommand('bold');
      return;
    }

    if (isModifier && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      runCommand('italic');
      return;
    }

    if (isModifier && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const href = window.prompt('Informe a URL do link:');
      if (href?.trim()) runCommand('createLink', href.trim());
      return;
    }

    if (showSlashMenu) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSlashMenu();
        return;
      }

      if (event.key === 'Enter' && filteredSlashActions[0]) {
        event.preventDefault();
        executeSlashAction(filteredSlashActions[0]);
        return;
      }
    }
  };

  const updateSlashState = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      closeSlashMenu();
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    if (container.nodeType !== Node.TEXT_NODE) {
      closeSlashMenu();
      return;
    }

    const text = container.textContent ?? '';
    const prefix = text.slice(0, range.startOffset);
    const slashMatch = prefix.match(/\/(\w*)$/);

    if (!slashMatch) {
      closeSlashMenu();
      return;
    }

    const rect = range.getBoundingClientRect();
    const rootRect = editorRef.current?.getBoundingClientRect();

    if (!rootRect) {
      closeSlashMenu();
      return;
    }

    setSlashQuery(slashMatch[1] ?? '');
    setSlashPosition({
      top: rect.bottom - rootRect.top + 8,
      left: rect.left - rootRect.left,
    });
    setShowSlashMenu(true);
  };

  const actions: ToolbarAction[] = [
    { label: 'Negrito', icon: <Bold className="w-4 h-4" />, onClick: () => runCommand('bold') },
    { label: 'Itálico', icon: <Italic className="w-4 h-4" />, onClick: () => runCommand('italic') },
    { label: 'Riscado', icon: <Strikethrough className="w-4 h-4" />, onClick: () => runCommand('strikeThrough') },
    { label: 'Título 1', icon: <Heading1 className="w-4 h-4" />, onClick: () => runCommand('formatBlock', 'h1') },
    { label: 'Título 2', icon: <Heading2 className="w-4 h-4" />, onClick: () => runCommand('formatBlock', 'h2') },
    { label: 'Lista', icon: <List className="w-4 h-4" />, onClick: () => runCommand('insertUnorderedList') },
    { label: 'Checklist', icon: <ListChecks className="w-4 h-4" />, onClick: insertChecklist },
    { label: 'Lista numerada', icon: <ListOrdered className="w-4 h-4" />, onClick: () => runCommand('insertOrderedList') },
    { label: 'Citação', icon: <Quote className="w-4 h-4" />, onClick: () => runCommand('formatBlock', 'blockquote') },
    { label: 'Tabela', icon: <Table2 className="w-4 h-4" />, onClick: insertTable },
    { label: 'Código', icon: <Code className="w-4 h-4" />, onClick: () => runCommand('formatBlock', 'pre') },
    { label: 'Limpar estilo', icon: <Eraser className="w-4 h-4" />, onClick: () => runCommand('removeFormat') },
  ];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="border-b px-3 py-2 flex items-center gap-1 flex-wrap bg-slate-50">
        {actions.map(action => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="p-1.5 rounded-md text-slate-600 hover:bg-white hover:text-slate-800 transition-colors"
            title={action.label}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={() => {
            syncEditorValue();
            updateSlashState();
          }}
          onBlur={syncEditorValue}
          onKeyDown={handleKeyDown}
          onKeyUp={updateSlashState}
          onClick={event => {
            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'checkbox') {
              syncEditorValue();
            }
            updateSlashState();
          }}
          className={cn(
            'rich-editor w-full px-4 py-3 outline-none text-slate-700 leading-relaxed',
            minHeightClassName
          )}
        />

        {showSlashMenu && filteredSlashActions.length > 0 && (
          <div
            className="absolute z-20 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-1"
            style={{ top: slashPosition.top, left: slashPosition.left }}
          >
            {filteredSlashActions.map(action => (
              <button
                key={action.label}
                type="button"
                onMouseDown={event => {
                  event.preventDefault();
                  executeSlashAction(action);
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">{action.label}</div>
                <div className="text-xs text-slate-500">{action.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
