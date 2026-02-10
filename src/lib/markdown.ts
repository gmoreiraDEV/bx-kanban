const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttribute = (value: string) => escapeHtml(value).replace(/`/g, '&#96;');

const sanitizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (
    /^(https?:|mailto:|tel:)/i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return escapeAttribute(trimmed);
  }
  return '#';
};

const splitTableRow = (row: string) =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());

const isTableSeparatorLine = (line: string) =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const looksLikeTableRow = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const pipeCount = (trimmed.match(/\|/g) ?? []).length;
  return pipeCount >= 1;
};

const formatInlineMarkdown = (value: string) => {
  const tokens: string[] = [];
  let output = escapeHtml(value);

  output = output.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@TOKEN_${tokens.length}@@`;
    tokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const token = `@@TOKEN_${tokens.length}@@`;
    const safeSrc = sanitizeUrl(src);
    tokens.push(`<img src="${safeSrc}" alt="${escapeAttribute(alt)}" />`);
    return token;
  });

  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const token = `@@TOKEN_${tokens.length}@@`;
    const safeHref = sanitizeUrl(href);
    tokens.push(`<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    return token;
  });

  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  output = output.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  output = output.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  tokens.forEach((tokenValue, index) => {
    output = output.replace(`@@TOKEN_${index}@@`, tokenValue);
  });

  return output;
};

const isBlockStart = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    /^#{1,6}\s+/.test(trimmed) ||
    /^```/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    /^[-*+]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed) ||
    looksLikeTableRow(trimmed)
  );
};

export const markdownToHtml = (
  markdown: string,
  options: { disableCheckboxes?: boolean } = {}
) => {
  const disableCheckboxes = options.disableCheckboxes ?? true;
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index];
    const trimmedLine = currentLine.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (/^```/.test(trimmedLine)) {
      const language = trimmedLine.slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;

      const safeLanguage = language ? ` class="language-${escapeAttribute(language)}"` : '';
      blocks.push(`<pre><code${safeLanguage}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${formatInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
      blocks.push('<hr />');
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmedLine)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }

      const quoteHtml = quoteLines.map(line => formatInlineMarkdown(line)).join('<br />');
      blocks.push(`<blockquote><p>${quoteHtml}</p></blockquote>`);
      continue;
    }

    const nextLine = lines[index + 1]?.trim() ?? '';
    if (looksLikeTableRow(trimmedLine) && isTableSeparatorLine(nextLine)) {
      const headerCells = splitTableRow(trimmedLine);
      index += 2;

      const bodyRows: string[][] = [];
      while (index < lines.length && looksLikeTableRow(lines[index])) {
        bodyRows.push(splitTableRow(lines[index]));
        index += 1;
      }

      const maxColumnCount = Math.max(
        headerCells.length,
        ...bodyRows.map(row => row.length),
        1
      );

      const normalizedHeaders = Array.from({ length: maxColumnCount }, (_, cellIndex) =>
        formatInlineMarkdown(headerCells[cellIndex] ?? '')
      );

      const headHtml = `<thead><tr>${normalizedHeaders
        .map(cell => `<th>${cell}</th>`)
        .join('')}</tr></thead>`;
      const bodyHtml = bodyRows.length
        ? `<tbody>${bodyRows
            .map(row => {
              const normalizedRow = Array.from({ length: maxColumnCount }, (_, cellIndex) =>
                formatInlineMarkdown(row[cellIndex] ?? '')
              );
              return `<tr>${normalizedRow.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
            })
            .join('')}</tbody>`
        : '';

      blocks.push(`<table>${headHtml}${bodyHtml}</table>`);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmedLine)) {
      const items: string[] = [];
      let hasTaskItems = false;

      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        const itemContent = lines[index].trim().replace(/^[-*+]\s+/, '');
        const taskMatch = itemContent.match(/^\[( |x|X)\]\s+(.*)$/);

        if (taskMatch) {
          hasTaskItems = true;
          const isChecked = taskMatch[1].toLowerCase() === 'x';
          const taskContent = formatInlineMarkdown(taskMatch[2]);
          const disabledAttribute = disableCheckboxes ? ' disabled' : '';
          items.push(
            `<li class="task-list-item"><input type="checkbox"${
              isChecked ? ' checked' : ''
            }${disabledAttribute} /><span>${taskContent}</span></li>`
          );
        } else {
          items.push(`<li>${formatInlineMarkdown(itemContent)}</li>`);
        }

        index += 1;
      }

      blocks.push(`<ul${hasTaskItems ? ' class="task-list"' : ''}>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmedLine)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        const itemContent = lines[index].trim().replace(/^\d+\.\s+/, '');
        items.push(`<li>${formatInlineMarkdown(itemContent)}</li>`);
        index += 1;
      }

      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) break;
      if (paragraphLines.length > 0 && isBlockStart(line)) break;
      paragraphLines.push(line.trimEnd());
      index += 1;
    }

    const paragraphHtml = paragraphLines.map(line => formatInlineMarkdown(line.trim())).join('<br />');
    blocks.push(`<p>${paragraphHtml}</p>`);
  }

  return blocks.join('\n');
};

const normalizeInlineValue = (value: string) =>
  value
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isCheckboxNode = (node: Node) =>
  node.nodeType === Node.ELEMENT_NODE &&
  (node as HTMLElement).tagName.toLowerCase() === 'input' &&
  (((node as HTMLInputElement).type || '').toLowerCase() === 'checkbox');

const serializeListItemContent = (element: HTMLElement, skipCheckbox: boolean) =>
  normalizeInlineValue(
    Array.from(element.childNodes)
      .filter(node => !(skipCheckbox && isCheckboxNode(node)))
      .map(node => serializeNode(node, 'li'))
      .join('')
  );

const serializeTableCell = (cell: HTMLElement) =>
  normalizeInlineValue(Array.from(cell.childNodes).map(node => serializeNode(node)).join(''));

const serializeNode = (node: Node, parentTag = ''): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes)
    .map(child => serializeNode(child, tag))
    .join('');

  switch (tag) {
    case 'br':
      return '\n';
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = Number(tag.substring(1));
      return `${'#'.repeat(level)} ${children.trim()}\n\n`;
    }
    case 'p': {
      const content = children.trim();
      return content ? `${content}\n\n` : '\n';
    }
    case 'div': {
      const content = children.trim();
      if (!content) return '\n';
      if (parentTag === 'li') return content;
      return `${content}\n\n`;
    }
    case 'strong':
    case 'b':
      return `**${children.trim()}**`;
    case 'em':
    case 'i':
      return `*${children.trim()}*`;
    case 'del':
    case 's':
      return `~~${children.trim()}~~`;
    case 'code':
      if (parentTag === 'pre') return children;
      return `\`${children.trim()}\``;
    case 'pre': {
      const code = element.textContent ?? '';
      return `\`\`\`\n${code.replace(/\n+$/, '')}\n\`\`\`\n\n`;
    }
    case 'blockquote': {
      const content = children.trim();
      if (!content) return '\n';
      return (
        content
          .split('\n')
          .map(line => (line.trim() ? `> ${line.trim()}` : '>'))
          .join('\n') + '\n\n'
      );
    }
    case 'ul': {
      const items = Array.from(element.children)
        .filter(child => child.tagName.toLowerCase() === 'li')
        .map(item => {
          const listItem = item as HTMLElement;
          const hasCheckbox = Array.from(listItem.childNodes).some(isCheckboxNode);
          if (hasCheckbox) {
            const checkboxNode = Array.from(listItem.childNodes).find(isCheckboxNode) as
              | HTMLInputElement
              | undefined;
            const content = serializeListItemContent(listItem, true);
            const checkedToken = checkboxNode?.checked ? 'x' : ' ';
            return `- [${checkedToken}] ${content}`.trimEnd();
          }
          return `- ${serializeListItemContent(listItem, false)}`;
        })
        .join('\n');
      return items ? `${items}\n\n` : '';
    }
    case 'ol': {
      const items = Array.from(element.children)
        .filter(child => child.tagName.toLowerCase() === 'li')
        .map((item, itemIndex) => `${itemIndex + 1}. ${serializeListItemContent(item as HTMLElement, false)}`)
        .join('\n');
      return items ? `${items}\n\n` : '';
    }
    case 'table': {
      const headerRow =
        element.querySelector('thead tr') ??
        element.querySelector('tr');
      if (!headerRow) return '';

      const headerCells = Array.from(headerRow.children).map(cell =>
        serializeTableCell(cell as HTMLElement)
      );
      if (headerCells.length === 0) return '';

      const bodyRows = Array.from(element.querySelectorAll('tbody tr'));
      const fallbackRows =
        bodyRows.length > 0
          ? bodyRows
          : Array.from(element.querySelectorAll('tr')).slice(1);

      const headerLine = `| ${headerCells.join(' | ')} |`;
      const separatorLine = `| ${headerCells.map(() => '---').join(' | ')} |`;
      const rowLines = fallbackRows.map(row => {
        const cells = Array.from(row.children).map(cell => serializeTableCell(cell as HTMLElement));
        while (cells.length < headerCells.length) cells.push('');
        return `| ${cells.slice(0, headerCells.length).join(' | ')} |`;
      });

      return `${[headerLine, separatorLine, ...rowLines].join('\n')}\n\n`;
    }
    case 'a': {
      const href = element.getAttribute('href') ?? '';
      const content = children.trim() || href;
      return href ? `[${content}](${href})` : content;
    }
    case 'img': {
      const src = element.getAttribute('src') ?? '';
      if (!src) return '';
      const alt = element.getAttribute('alt') ?? '';
      return `![${alt}](${src})`;
    }
    case 'input':
      return '';
    default:
      return children;
  }
};

export const htmlToMarkdown = (html: string) => {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = documentNode.body.firstElementChild;
  if (!root) return '';

  const markdown = Array.from(root.childNodes)
    .map(node => serializeNode(node))
    .join('');

  return markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const markdownToPlainText = (markdown: string) =>
  markdown
    .replace(/```[\s\S]*?```/g, value => value.replace(/```/g, ''))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+\[( |x|X)\]\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
    .replace(/^\s*\|(.+)\|\s*$/gm, (_, row: string) => row.replace(/\|/g, ' '))
    .replace(/[*_~]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
