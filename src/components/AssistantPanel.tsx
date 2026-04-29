import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Loader2, ChevronDown } from 'lucide-react';
import { onLoadProgress, streamReply, type ChatMessage } from '@/lib/llm';
import type { InitProgressReport } from '@mlc-ai/web-llm';

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS: ReadonlyArray<string> = [
  'Summarize the limitation-of-liability conventions under California law.',
  'Draft a one-paragraph privileged memo header for a vendor diligence matter.',
  'Outline an IRAC analysis for a force majeure dispute.',
  'List the elements of a § 17200 unfair business practices claim.',
];

export default function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [progress, setProgress] = useState<InitProgressReport | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      for await (const delta of streamReply(next)) {
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
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-white border-l border-border shadow-2xl flex flex-col transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-r from-navy-dark to-navy text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <div>
              <p className="font-serif text-base font-bold leading-none">Circuitus Assistant</p>
              <p className="text-[9px] font-mono uppercase tracking-wider text-gold/80 mt-0.5">
                On-Device · Privileged Channel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white"
            title="Close assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-navy/5 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-navy" />
              </div>
              <p className="font-serif text-base text-navy mb-1">How can I help?</p>
              <p className="text-[11px] font-sans text-text-muted leading-relaxed mb-4 max-w-xs mx-auto">
                Powered by an on-device language model. No queries leave this browser.
              </p>
              <div className="space-y-2 text-left">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="w-full text-left text-[11px] font-sans text-text-main bg-cream border border-border rounded px-3 py-2 hover:border-gold/50 hover:bg-cream/80"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && messages.length === 0 && (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 text-gold mx-auto animate-spin mb-3" />
              <p className="font-serif text-sm text-navy">Initializing on-device model</p>
              <p className="text-[10px] font-mono text-text-muted mt-2">
                {progress?.text ?? 'Preparing inference engine…'}
              </p>
              <div className="w-48 mx-auto h-1 bg-border rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gold transition-all"
                  style={{ width: `${loadPercent}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-text-muted/70 mt-1">{loadPercent}%</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  m.role === 'user'
                    ? 'bg-navy text-white font-sans text-[12px]'
                    : 'bg-cream border border-border font-serif text-[13px] text-text-main leading-relaxed'
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? <span className="animate-pulse">▍</span> : '')}
              </div>
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-[11px] font-sans text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-cream/40 p-3 flex-shrink-0">
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
              className="flex-1 resize-none bg-white border border-border rounded px-3 py-2 text-[12px] font-sans focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="bg-navy text-white rounded px-3 disabled:opacity-40 hover:bg-navy-light"
              title="Send (Enter)"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] font-mono text-text-muted/60">
              Llama-3.2-1B · q4f32 · WebGPU
            </span>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-[10px] font-sans text-text-muted hover:text-navy flex items-center gap-1"
              >
                Clear conversation <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
