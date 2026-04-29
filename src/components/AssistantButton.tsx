import { Sparkles } from 'lucide-react';

interface AssistantButtonProps {
  onClick: () => void;
}

export default function AssistantButton({ onClick }: AssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-6 z-30 flex items-center gap-2 bg-gradient-to-r from-navy to-navy-dark text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all border border-gold/30"
      title="Open Circuitus Assistant"
    >
      <span className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-gold" />
      </span>
      <span className="font-serif text-sm">Ask Circuitus</span>
    </button>
  );
}
