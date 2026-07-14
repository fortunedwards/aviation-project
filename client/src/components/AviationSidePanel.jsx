import React, { useEffect, useState } from 'react';

export const DEFAULT_AVIATION_SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1503468120394-03d29a34a0bf?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Airline cockpit with pilots during flight',
  },
  {
    image:
      'https://images.unsplash.com/photo-1752579664702-e6609516e21a?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Professional aviation training classroom',
  },
  {
    image:
      'https://images.unsplash.com/photo-1775029324059-04bd762eba0d?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Flight attendants working inside an aircraft cabin',
  },
  {
    image:
      'https://images.unsplash.com/photo-1757030689792-3fccb8813f8f?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Workers repairing airport tarmac near an airplane at night',
  },
  {
    image:
      'https://images.unsplash.com/photo-1748362686556-3255add83eac?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Ground crew directing a plane on the tarmac',
  },
];

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
