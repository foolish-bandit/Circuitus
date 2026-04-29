import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Loader2, ChevronDown } from 'lucide-react';
import { onLoadProgress, resetEngine, streamReply, type ChatMessage } from '@/lib/llm';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { InitProgressReport } from '@mlc-ai/web-llm';

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  /** Optional callback that returns the active workspace context (open
   * matter title, current draft excerpt, etc.) injected into the LLM's
   * system prompt before each send. */
  getContext?: () => string;
}

const SUGGESTED_PROMPTS: ReadonlyArray<string> = [
  'Summarize the limitation-of-liability conventions under California law.',
  'Draft a one-paragraph privileged memo header for a vendor diligence matter.',
  'Outline an IRAC analysis for a force majeure dispute.',
  'List the elements of a § 17200 unfair business practices claim.',
];

export default function AssistantPanel({ open, onClose, getContext }: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [progress, setProgress] = useState<InitProgressReport | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    return onLoadProgress((report) => {
      setProgress(report);
      if (report.progress >= 1) setModelReady(true);
    });
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length, streaming]);

  async function send(content: string) {
    if (!content.trim() || streaming) return;
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming(true);

    try {
      let assistantText = '';
      // Push placeholder assistant message we'll mutate as tokens stream in
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const ctx = getContext?.();
      for await (const delta of streamReply(next, ctx)) {
        assistantText += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
      // Remove the empty placeholder assistant message on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setStreaming(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  const loading = progress !== null && !modelReady;
  const loadPercent = progress ? Math.round(progress.progress * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Circuitus Assistant"
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[460px] bg-paper-cool flex flex-col transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          borderLeft: '1px solid #9C7A1F',
          boxShadow: '-24px 0 64px -32px rgba(14,17,22,0.35)',
        }}
      >
        <div className="bg-navy text-paper">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span
                className="w-7 h-7 flex items-center justify-center text-brass-bright"
                style={{
                  border: '1px solid rgba(184, 147, 43, 0.5)',
                  background: 'rgba(184, 147, 43, 0.08)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div className="leading-none">
                <p className="font-display text-[16px] leading-none">Circuitus Assistant</p>
                <p className="font-sans text-[8.5px] tracking-marque uppercase text-brass-bright/85 mt-1">
                  On-Device · Privileged Channel
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-paper/65 hover:text-brass-bright transition-colors"
              title="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="rule-double" aria-hidden />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="kicker-brass mb-3">
                <span className="inline-block w-5 h-px bg-brass align-middle mr-2.5" />
                Ask of Counsel
                <span className="inline-block w-5 h-px bg-brass align-middle ml-2.5" />
              </p>
              <p className="font-display text-[18px] text-ink mb-1">How may I assist you?</p>
              <p className="font-serif italic text-[12px] text-ink-muted leading-relaxed mb-5 max-w-xs mx-auto">
                Inference runs entirely on this device. No queries leave the browser.
              </p>
              <div className="space-y-2 text-left">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="w-full text-left font-serif text-[12.5px] italic text-ink bg-paper px-3.5 py-2.5 hover:bg-paper-warm transition-colors"
                    style={{ border: '1px solid #D9D2C0', borderRadius: 0 }}
                  >
                    <span className="text-brass not-italic mr-1.5">›</span>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && messages.length === 0 && (
            <div className="text-center py-8">
              <span className="editorial-loader mb-4" aria-hidden />
              <p className="font-display text-[15px] text-ink mt-3">Initializing model</p>
              <p className="font-serif italic text-[11.5px] text-ink-muted mt-2">
                {progress?.text ?? 'Preparing inference engine…'}
              </p>
              <div
                className="w-48 mx-auto h-px mt-4"
                style={{ background: '#D9D2C0' }}
              >
                <div className="h-px bg-brass transition-all" style={{ width: `${loadPercent}%` }} />
              </div>
              <p className="font-mono text-[10px] text-ink-muted/70 mt-2">{loadPercent}%</p>
              <p className="font-mono text-[9px] text-ink-muted/50 mt-3 max-w-[260px] mx-auto leading-relaxed">
                First open downloads ~700MB of weights into the browser cache.
                Subsequent opens are instant.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={`max-w-[88%] px-3.5 py-2.5 ${
                  m.role === 'user'
                    ? 'bg-navy text-paper font-sans text-[12px]'
                    : 'bg-paper font-serif text-[13.5px] text-ink leading-relaxed'
                }`}
                style={
                  m.role === 'user'
                    ? { borderRadius: 0 }
                    : { border: '1px solid #D9D2C0', borderRadius: 0 }
                }
              >
                {m.content || (streaming && i === messages.length - 1 ? <span className="animate-pulse">▍</span> : '')}
              </div>
            </div>
          ))}

          {error && (
            <div
              className="bg-claret/5 px-3 py-2.5"
              style={{ border: '1px solid rgba(122, 30, 46, 0.3)' }}
            >
              <p className="font-serif text-[12px] italic text-claret-dark">
                <span className="smcp not-italic mr-2">Notice —</span>
                {error}
              </p>
              <button
                onClick={() => {
                  resetEngine();
                  setError(null);
                  setProgress(null);
                  setModelReady(false);
                  // Re-issue the last user message if there was one
                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUser) {
                    setMessages((prev) => prev.filter((m) => m !== lastUser));
                    void send(lastUser.content);
                  }
                }}
                className="mt-2 font-sans text-[10px] uppercase tracking-marque text-claret hover:text-claret-dark"
              >
                ↻ Retry
              </button>
            </div>
          )}
        </div>

        <div
          className="bg-paper p-3.5 flex-shrink-0"
          style={{ borderTop: '1px solid #D9D2C0' }}
        >
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={modelReady ? 'Ask Circuitus…' : 'Loading model — type to queue your question…'}
              rows={2}
              className="flex-1 resize-none bg-paper-cool px-3 py-2 text-[12.5px] font-sans focus:outline-none focus:border-brass transition-colors"
              style={{ border: '1px solid #D9D2C0', borderRadius: 0 }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="bg-navy text-paper px-3 disabled:opacity-40 hover:bg-navy-dark transition-colors"
              style={{
                borderRadius: 0,
                border: '1px solid #0A1F3D',
                boxShadow: 'inset 0 0 0 1px rgba(184, 147, 43, 0.22)',
              }}
              title="Send (Enter)"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-mono text-[9px] text-ink-muted/60 tracking-wider">
              Llama-3.2-1B · q4f32 · WebGPU
            </span>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="font-sans text-[9.5px] uppercase tracking-marque text-ink-muted hover:text-claret flex items-center gap-1 transition-colors"
              >
                Clear · Conversation <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
