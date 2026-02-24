'use client'

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Bold,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  Table2,
} from 'lucide-react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $createTableNodeWithDimensions, TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { CodeNode } from '@lexical/code';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown';

import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  editorStateJson?: string;
  onEditorStateJsonChange?: (stateJson: string) => void;
}

interface ToolbarAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const MARKDOWN_TRANSFORMERS = [...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS];

const Toolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  const setHeading = (level: 'h1' | 'h2') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(level));
      }
    });
  };

  const setQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const insertTable = () => {
    editor.update(() => {
      const tableNode = $createTableNodeWithDimensions(2, 2, true);
      $insertNodes([tableNode]);
    });
  };

  const insertLink = () => {
    const href = window.prompt('Informe a URL do link:');
    if (href?.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, href.trim());
    }
  };

  const actions: ToolbarAction[] = [
    { label: 'Negrito', icon: <Bold className="w-4 h-4" />, onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold') },
    { label: 'Itálico', icon: <Italic className="w-4 h-4" />, onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic') },
    { label: 'Riscado', icon: <Strikethrough className="w-4 h-4" />, onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough') },
    { label: 'Título 1', icon: <Heading1 className="w-4 h-4" />, onClick: () => setHeading('h1') },
    { label: 'Título 2', icon: <Heading2 className="w-4 h-4" />, onClick: () => setHeading('h2') },
    { label: 'Lista', icon: <List className="w-4 h-4" />, onClick: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
    { label: 'Checklist', icon: <ListChecks className="w-4 h-4" />, onClick: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined) },
    { label: 'Lista numerada', icon: <ListOrdered className="w-4 h-4" />, onClick: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) },
    { label: 'Citação', icon: <Quote className="w-4 h-4" />, onClick: setQuote },
    { label: 'Tabela', icon: <Table2 className="w-4 h-4" />, onClick: insertTable },
    { label: 'Código', icon: <Code className="w-4 h-4" />, onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code') },
    { label: 'Link', icon: <Link2 className="w-4 h-4" />, onClick: insertLink },
    { label: 'Limpar lista', icon: <Eraser className="w-4 h-4" />, onClick: () => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined) },
  ];

  return (
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
  );
};

const EditorHydrationPlugin: React.FC<{
  value: string;
  editorStateJson?: string;
  lastMarkdownRef: React.MutableRefObject<string>;
  isHydratingRef: React.MutableRefObject<boolean>;
}> = ({ value, editorStateJson, lastMarkdownRef, isHydratingRef }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (value === lastMarkdownRef.current && !editorStateJson) return;

    isHydratingRef.current = true;

    try {
      if (editorStateJson && editorStateJson !== '{}') {
        try {
          const parsed = JSON.parse(editorStateJson) as { html?: string; root?: unknown };

          if (parsed && typeof parsed === 'object' && parsed.root) {
            const lexicalState = editor.parseEditorState(editorStateJson);
            editor.setEditorState(lexicalState);
            lastMarkdownRef.current = value;
            return;
          }

          if (typeof parsed?.html === 'string') {
            editor.update(() => {
              const parser = new DOMParser();
              const dom = parser.parseFromString(`<div>${parsed.html}</div>`, 'text/html');
              const rootElement = dom.body.firstElementChild;
              const root = $getRoot();
              root.clear();

              if (!rootElement) {
                root.append($createParagraphNode().append($createTextNode('')));
                return;
              }

              const nodes = $generateNodesFromDOM(editor, rootElement);
              if (nodes.length > 0) {
                root.append(...nodes);
              } else {
                root.append($createParagraphNode().append($createTextNode('')));
              }
            });

            lastMarkdownRef.current = htmlToMarkdown(parsed.html);
            return;
          }
        } catch {
          // fallback abaixo
        }
      }

      editor.update(() => {
        const parser = new DOMParser();
        const html = markdownToHtml(value, { disableCheckboxes: false });
        const dom = parser.parseFromString(`<div>${html}</div>`, 'text/html');
        const rootElement = dom.body.firstElementChild;
        const root = $getRoot();
        root.clear();

        if (!rootElement) {
          root.append($createParagraphNode().append($createTextNode('')));
          return;
        }

        const nodes = $generateNodesFromDOM(editor, rootElement);
        if (nodes.length > 0) {
          root.append(...nodes);
        } else {
          root.append($createParagraphNode().append($createTextNode('')));
        }
      });

      lastMarkdownRef.current = value;
    } finally {
      queueMicrotask(() => {
        isHydratingRef.current = false;
      });
    }
  }, [editor, editorStateJson, isHydratingRef, lastMarkdownRef, value]);

  return null;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Comece a escrever...',
  minHeightClassName = 'min-h-[500px]',
  editorStateJson,
  onEditorStateJsonChange,
}) => {
  const lastMarkdownRef = useRef(value);
  const isHydratingRef = useRef(false);

  const initialConfig = useMemo(
    () => ({
      namespace: 'pages-lexical-editor',
      onError: (error: Error) => {
        throw error;
      },
      theme: {},
      nodes: [HeadingNode, QuoteNode, CodeNode, LinkNode, ListNode, ListItemNode, TableNode, TableRowNode, TableCellNode],
    }),
    []
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />

        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn('rich-editor w-full px-4 py-3 outline-none text-slate-700 leading-relaxed', minHeightClassName)}
                aria-placeholder={placeholder}
              />
            }
            placeholder={<div className="pointer-events-none absolute top-3 left-4 text-slate-400">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />

          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin hasCellBackgroundColor hasCellMerge hasTabHandler />
          <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />

          <EditorHydrationPlugin
            value={value}
            editorStateJson={editorStateJson}
            lastMarkdownRef={lastMarkdownRef}
            isHydratingRef={isHydratingRef}
          />

          <OnChangePlugin
            onChange={(editorState, editor) => {
              if (isHydratingRef.current) return;

              editorState.read(() => {
                const html = $generateHtmlFromNodes(editor, null);
                const markdown = htmlToMarkdown(html);
                lastMarkdownRef.current = markdown;
                onChange(markdown);
              });

              onEditorStateJsonChange?.(JSON.stringify(editorState.toJSON()));
            }}
          />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default RichTextEditor;
