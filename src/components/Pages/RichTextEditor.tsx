'use client'


import React, { useEffect, useRef } from 'react';
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

import { cn } from '@/lib/utils';
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
}

interface ToolbarAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Comece a escrever...',
  minHeightClassName = 'min-h-[500px]',
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastMarkdownRef = useRef('');

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
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncEditorValue}
        onBlur={syncEditorValue}
        onClick={event => {
          const target = event.target as HTMLElement;
          if (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'checkbox') {
            syncEditorValue();
          }
        }}
        className={cn(
          'rich-editor w-full px-4 py-3 outline-none text-slate-700 leading-relaxed',
          minHeightClassName
        )}
      />
    </div>
  );
};

export default RichTextEditor;
