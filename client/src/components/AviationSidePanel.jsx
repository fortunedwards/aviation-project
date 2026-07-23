import React, { useEffect, useState } from 'react';
import { AVIATION_SIDE_PANEL_SLIDES } from '../data/images';

export const DEFAULT_AVIATION_SLIDES = AVIATION_SIDE_PANEL_SLIDES;

const AviationSidePanel = ({
  children,
  slides = DEFAULT_AVIATION_SLIDES,
  asideClassName = 'lg:block lg:w-[40%]',
  contentClassName = 'relative flex h-full flex-col p-10 xl:p-14',
  autoRotate = true,
  intervalMs = 4200,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!autoRotate || slides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [autoRotate, intervalMs, slides]);

  return (
    <aside className={`relative hidden overflow-hidden ${asideClassName}`}>
      <div className="absolute inset-0 bg-[#0C3C5E]">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            aria-hidden={index !== activeSlide}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2095D3]/72 via-[#1785BF]/78 to-[#0D3D5E]/88" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]" />
      </div>

      <div className={contentClassName}>
        {typeof children === 'function'
          ? children({ activeSlide, setActiveSlide, slides })
          : children}
      </div>
    </aside>
  );
};

export default AviationSidePanel;
