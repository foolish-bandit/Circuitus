import { Sparkles } from 'lucide-react';

interface AssistantButtonProps {
  onClick: () => void;
}

export default function AssistantButton({ onClick }: AssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-7 right-7 z-30 group flex items-center gap-3 bg-navy text-paper pl-3 pr-5 py-2.5 transition-all hover:bg-navy-dark"
      style={{
        borderRadius: 0,
        border: '1px solid rgba(184, 147, 43, 0.5)',
        boxShadow:
          'inset 0 0 0 1px rgba(184, 147, 43, 0.15), 0 1px 0 rgba(14,17,22,0.06), 0 12px 32px -16px rgba(14,17,22,0.45)',
      }}
      title="Open Circuitus Assistant"
    >
      <span
        className="w-7 h-7 flex items-center justify-center text-brass-bright"
        style={{ borderRight: '1px solid rgba(184, 147, 43, 0.35)', paddingRight: 8 }}
      >
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      <span className="text-left">
        <span className="block font-display text-[14px] leading-none">Ask Circuitus</span>
        <span className="block font-mono text-[8.5px] tracking-marque uppercase text-paper/55 mt-1">
          On-Device · Privileged
        </span>
      </span>
    </button>
  );
}
