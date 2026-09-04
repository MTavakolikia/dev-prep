'use client';

import { useState, memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from "lucide-react";

// ============================================================
// CodeBlock — syntax highlighting, copy button, line numbers,
// language label. Extracted from raw article HTML.
// ============================================================
export const CodeBlock = memo(function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = (language ?? 'ts').toLowerCase();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-zinc-700/60 bg-[#0d1117] shadow-sm print:break-inside-avoid">
      <div className="flex items-center justify-between border-b border-zinc-700/60 px-4 py-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700/80 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang === 'ts' ? 'typescript' : lang === 'js' ? 'javascript' : lang}
        style={oneDark}
        showLineNumbers
        wrapLongLines={false}
        customStyle={{
          margin: 0, padding: '14px 16px', background: 'transparent', fontSize: '13px', lineHeight: 1.65,
        }}
        codeTagProps={{ style: { fontFamily: 'var(--font-geist-mono), monospace' } }}
        lineNumberStyle={{ color: '#4b5563', minWidth: '2.2em', userSelect: 'none' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
});

// ============================================================
// ArticleContent — renders composed article HTML, splitting out
// code blocks for the highlighter. Also collects the TOC.
// ============================================================
export interface TocItem { id: string; text: string; level: 2 | 3 }

export function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    items.push({ id: match[2], text: match[3].replace(/<[^>]+>/g, '').trim(), level: Number(match[1]) as 2 | 3 });
  }
  return items;
}

export function ArticleContent({ html }: { html: string }) {
  const parts: { type: 'html' | 'code'; value: string; lang?: string }[] = [];
  const regex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    if (m.index > last) parts.push({ type: 'html', value: html.slice(last, m.index) });
    parts.push({ type: 'code', value: decodeHtml(m[2]), lang: m[1] });
    last = m.index + m[0].length;
  }
  if (last < html.length) parts.push({ type: 'html', value: html.slice(last) });

  return (
    <div>
      {parts.map((p, i) =>
        p.type === 'html' ? (
          <div key={i} className="df-prose" dangerouslySetInnerHTML={{ __html: p.value }} />
        ) : (
          <CodeBlock key={i} code={p.value} language={p.lang} />
        ),
      )}
    </div>
  );
}

function decodeHtml(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

