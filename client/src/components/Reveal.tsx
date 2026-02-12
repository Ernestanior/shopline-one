import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Reveal.css';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  once?: boolean;
};

const Reveal: React.FC<RevealProps> = ({ children, className = '', delayMs = 0, once = true }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const style = useMemo<React.CSSProperties>(() => {
    if (!delayMs) return {};
    return { transitionDelay: `${delayMs}ms` };
  }, [delayMs]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

export default Reveal;
