import { ReactNode, useRef } from 'react';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

export function AutoTranslate({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useAutoTranslate(containerRef);

  return (
    <div ref={containerRef} className="min-h-screen">
      {children}
    </div>
  );
}
