import { useEffect, useRef, useState, useCallback } from 'react';

export interface PanicState {
  isPanicked: boolean;
  savedScrollPosition: number;
  savedDocumentId: string | null;
  savedActiveTab: string | null;
}

export function usePanicKey() {
  const [isPanicked, setIsPanicked] = useState(false);
  const preStateRef = useRef<{
    scrollTop: number;
    documentId: string | null;
    activeTab: string | null;
  }>({
    scrollTop: 0,
    documentId: null,
    activeTab: null,
  });

  const togglePanic = useCallback(() => {
    setIsPanicked((prev) => !prev);
  }, []);

  const savePanicState = useCallback(
    (scrollTop: number, documentId: string | null, activeTab: string | null) => {
      preStateRef.current = { scrollTop, documentId, activeTab };
    },
    [],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        togglePanic();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePanic]);

  useEffect(() => {
    if (isPanicked) {
      document.title = 'Circuitus | SOW Structuring — Practice Guide';
    } else {
      document.title = 'Circuitus | Legal Research Suite';
    }
  }, [isPanicked]);

  return {
    isPanicked,
    togglePanic,
    preState: preStateRef.current,
    savePanicState,
  };
}
