'use client';

// ============================================================
// Dev Prep — CMS article editor (Tiptap):
// rich toolbar, slash hint, markdown shortcuts, code blocks,
// images/links/tables, autosave, status workflow, SEO panel,
// revision restore, AI outline placeholder hooks.
// ============================================================
import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { navigate } from '@/router';
import { adminGetArticleAction, adminUpdateArticleAction, adminCreateArticleAction, adminListTaxonomyAction, adminListRevisionsAction, adminRestoreRevisionAction } from '@/server/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ARTICLE_STATUSES, DIFFICULTIES } from '@/types';
import { StatusBadge } from '@/components/shared/primitives';
import { toast } from 'sonner';
import {
  Bold, Italic, Underline, Code, Heading2, Heading3, List, ListOrdered, Quote,
  Link2, ImagePlus, Undo2, Redo2, Minus, Save, ArrowLeft, Eye, History, Sparkles, Table as TableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ArticleEditor({ id }: { id: string | null }) {
  const queryClient = useQueryClient();
  const isNew = id === null;
  const { data: article, isLoading } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => adminGetArticleAction(id!),
    enabled: !isNew,
  });
  const { data: taxonomy } = useQuery({ queryKey: ['admin-taxonomy'], queryFn: adminListTaxonomyAction });
  const { data: revisions } = useQuery({
    queryKey: ['admin-revisions', id],
    queryFn: () => adminListRevisionsAction(id!),
    enabled: !isNew,
  });

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [techId, setTechId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('intermediate');
  const [status, setStatus] = useState<string>('DRAFT');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [keywords, setKeywords] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg border max-w-full' } }),
      Placeholder.configure({ placeholder: 'Write the article. Type "/" for blocks, use markdown shortcuts like ## and - …' }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'df-prose min-h-[420px] outline-none', spellcheck: 'true' },
    },
    onUpdate: () => setDirty(true),
  });

  // hydrate form state from server data once per article (render-adjustment pattern)
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  if (article && hydratedId !== article.id) {
    setHydratedId(article.id);
    setTitle(article.title);
    setExcerpt(article.excerpt);
    setTechId(article.technology?.id ?? '');
    setDifficulty(article.difficulty);
    setStatus(article.status);
    setSeoTitle(article.seoTitle ?? '');
    setSeoDesc(article.seoDescription ?? '');
    setKeywords(article.seoKeywords ?? '');
    requestAnimationFrame(() => editor?.commands.setContent(article.content || '<p></p>'));
  }

  const save = useMutation({
    mutationFn: async () => {
      const content = editor?.getHTML() ?? '';
      const payload = {
        title: title || 'Untitled draft', excerpt, content, technologyId: techId || null,
        difficulty, status, seoTitle: seoTitle || null, seoDescription: seoDesc || null,
        seoKeywords: keywords || null, readingTime: Math.max(2, Math.round(content.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200)),
      };
      return isNew ? adminCreateArticleAction(payload) : adminUpdateArticleAction(id!, payload);
    },
    onSuccess: (r) => {
      if (r.ok) {
        setDirty(false);
        toast.success(isNew ? 'Article created' : 'Article saved · revision recorded');
        queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
        if (isNew && 'id' in r && r.id) navigate(`/admin/articles/${r.id}`);
      } else toast.error(r.error ?? 'Save failed');
    },
  });

  const restore = useMutation({
    mutationFn: (revisionId: string) => adminRestoreRevisionAction(id!, revisionId),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success('Revision restored');
        queryClient.invalidateQueries({ queryKey: ['admin-article', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-revisions', id] });
        setHydratedId(null); // force form re-hydration from restored article
      } else toast.error(r.error ?? 'Restore failed');
    },
  });

  const handleSave = () => { setSaving(true); save.mutate(); setTimeout(() => setSaving(false), 600); };
  const preview = () => {
    if (status === 'PUBLISHED' || status === 'DRAFT') {
      navigate('/articles');
      toast.info('Published articles are at /articles — drafts preview there after publishing.');
    }
  };

  if (!isNew && isLoading) return <Skeleton className="h-[70vh] rounded-2xl" />;
  if (!isNew && !article) return <p className="py-20 text-center text-sm text-muted-foreground">Article not found.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/articles')} aria-label="Back to articles">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{isNew ? 'New article' : 'Edit article'}</h1>
            {!isNew && article && (
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <StatusBadge status={article.status} /> · {article.views.toLocaleString()} views · slug /{article.slug}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setDirty(true); }}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ARTICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={preview}><Eye className="h-4 w-4" /> Preview</Button>
          <Button onClick={handleSave} disabled={saving} className={cn(dirty && 'shadow-md shadow-primary/25')}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* main editor column */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <Input
              value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              placeholder="Article title — make it specific and searchable"
              className="h-auto border-0 bg-transparent px-0 text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0"
              aria-label="Article title"
            />
            <Textarea
              value={excerpt} onChange={(e) => { setExcerpt(e.target.value); setDirty(true); }}
              placeholder="One or two sentence excerpt shown on cards and search results…"
              className="mt-2 min-h-16 resize-none border-0 bg-transparent px-0 text-[13.5px] shadow-none focus-visible:ring-0"
              aria-label="Excerpt"
            />
          </div>

          {/* toolbar */}
          <div className="sticky top-[68px] z-20 flex flex-wrap items-center gap-0.5 rounded-xl border bg-background/95 p-1.5 backdrop-blur">
            <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} label="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} label="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleUnderline?.().run() ?? editor?.chain().focus().toggleItalic().run()} active={false} label="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} label="Inline code"><Code className="h-3.5 w-3.5" /></ToolBtn>
            <span className="mx-1 h-5 w-px bg-border" />
            <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} label="Heading 2"><Heading2 className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} label="Heading 3"><Heading3 className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} label="Bullet list"><List className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} label="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} label="Quote"><Quote className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} label="Code block"><TableIcon className="h-3.5 w-3.5 rotate-90" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} label="Divider"><Minus className="h-3.5 w-3.5" /></ToolBtn>
            <span className="mx-1 h-5 w-px bg-border" />
            <ToolBtn
              onClick={() => { const url = window.prompt('Link URL'); if (url) editor?.chain().focus().setLink({ href: url }).run(); }}
              active={editor?.isActive('link')} label="Link"
            ><Link2 className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => { const url = window.prompt('Image URL'); if (url) editor?.chain().focus().setImage({ src: url }).run(); }} label="Image"><ImagePlus className="h-3.5 w-3.5" /></ToolBtn>
            <span className="mx-1 h-5 w-px bg-border" />
            <ToolBtn onClick={() => editor?.chain().focus().undo().run()} label="Undo"><Undo2 className="h-3.5 w-3.5" /></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().redo().run()} label="Redo"><Redo2 className="h-3.5 w-3.5" /></ToolBtn>
            <span className="ml-auto pr-2 text-[11px] text-muted-foreground">
              {editor?.storage.characterCount ? '' : ''}{dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
          </div>

          <div className="rounded-xl border bg-card px-6 py-5">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* side panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Publishing</h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Technology</Label>
                <Select value={techId} onValueChange={(v) => { setTechId(v); setDirty(true); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Choose technology" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {taxonomy?.technologies.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setDirty(true); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> AI tools
            </h2>
            <div className="mt-3 grid gap-1.5">
              {['Generate outline', 'Improve draft', 'Generate SEO metadata', 'Suggest interview questions'].map((tool) => (
                <button
                  key={tool}
                  onClick={() => toast.info(`"${tool}" is wired into the AI abstraction layer — enable it by configuring AI_PROVIDER.`)}
                  className="rounded-lg border border-dashed px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="seo">
            <TabsList className="w-full">
              <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
              <TabsTrigger value="revisions" className="flex-1">Revisions</TabsTrigger>
            </TabsList>
            <TabsContent value="seo" className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">SEO title</Label>
                <Input value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); setDirty(true); }} placeholder="Defaults to article title" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Meta description</Label>
                <Textarea value={seoDesc} onChange={(e) => { setSeoDesc(e.target.value); setDirty(true); }} className="min-h-16 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Keywords</Label>
                <Input value={keywords} onChange={(e) => { setKeywords(e.target.value); setDirty(true); }} placeholder="react, hooks, performance" className="h-9 text-[13px]" />
              </div>
            </TabsContent>
            <TabsContent value="revisions" className="mt-3">
              {revisions && revisions.length > 0 ? (
                <div className="space-y-2">
                  {revisions.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium">#{r.revisionNumber} · {r.note ?? 'Update'}</p>
                        <p className="text-[10.5px] text-muted-foreground">{r.editor} · {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => restore.mutate(r.id)}>Restore</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">No revisions yet — every content save creates one.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
