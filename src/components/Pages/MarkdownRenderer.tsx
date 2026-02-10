'use client'


import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { markdownToHtml } from '@/lib/markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const html = useMemo(() => markdownToHtml(content), [content]);

  if (!content.trim()) {
    return <p className={cn('text-slate-400 italic', className)}>Sem conteúdo ainda.</p>;
  }

  return (
    <div
      className={cn('markdown-rendered', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;
