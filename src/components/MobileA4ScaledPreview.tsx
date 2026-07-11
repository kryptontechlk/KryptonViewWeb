import React, { useState, useEffect, useRef } from 'react';

interface MobileA4ScaledPreviewProps {
  children: React.ReactNode;
}

export default function MobileA4ScaledPreview({ children }: MobileA4ScaledPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const parentWidth = containerRef.current?.getBoundingClientRect().width || 0;
      // Standard A4 width pixel target is 794px at typical PPI.
      // If the parent width is smaller than the target, scale down proportionally.
      if (parentWidth > 0 && parentWidth < 794) {
        setScale(parentWidth / 794);
      } else {
        setScale(1);
      }
    };

    updateScale();

    // Use ResizeObserver for responsive recalculation
    const observer = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center bg-slate-50 py-1.5 overflow-hidden print:p-0 print:bg-white print:overflow-visible print:block">
      <div
        style={{
          width: '794px',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          height: `${1123 * scale}px`, // Locks standard A4 1:1.414 aspect ratio perfectly, preventing empty white spaces
          marginBottom: '5px'
        }}
        className="shrink-0 transition-transform duration-100 ease-out print-preview-reset"
      >
        {children}
      </div>
    </div>
  );
}
