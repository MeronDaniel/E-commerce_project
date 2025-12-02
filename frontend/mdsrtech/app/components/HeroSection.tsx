'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    {
      id: 1,
      title: 'EXCLUSIVE DISCOUNT',
      subtitle: 'Get 20% Off Your First Order',
      description: 'Use code WELCOME20 at checkout',
      bgColor: 'from-purple-600 to-blue-600',
      textColor: 'text-white',
    },
    {
      id: 2,
      title: 'iPhone 17 Pro',
      subtitle: 'The Future is Here',
      description: 'Experience the revolutionary A18 chip and titanium design',
      buttonText: 'Shop Apple',
      bgColor: 'from-slate-900 to-slate-700',
      textColor: 'text-white',
    },
    {
      id: 3,
      title: 'Accessory Deals',
      subtitle: 'Up to 40% Off',
      description: 'Premium cases, chargers, and more for all your devices',
      buttonText: 'Shop Accessories',
      bgColor: 'from-orange-500 to-pink-500',
      textColor: 'text-white',
    },
  ];

  const resetInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setDirection('right');
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 'right' : 'left');
    setCurrentSlide(index);
    resetInterval();
  };

  const nextSlide = () => {
    setDirection('right');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    resetInterval();
  };

  const prevSlide = () => {
    setDirection('left');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    resetInterval();
  };

  return (
    <div className="relative h-[calc(100vh-12rem)] w-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const isPrev = direction === 'right' 
          ? index === (currentSlide - 1 + slides.length) % slides.length
          : index === (currentSlide + 1) % slides.length;
        
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              isActive
                ? 'opacity-100 translate-x-0 z-10'
                : isPrev
                ? direction === 'right'
                  ? 'opacity-0 -translate-x-full z-0'
                  : 'opacity-0 translate-x-full z-0'
                : direction === 'right'
                ? 'opacity-0 translate-x-full z-0'
                : 'opacity-0 -translate-x-full z-0'
            }`}
          >
          <div
            className={`h-full w-full bg-linear-to-br ${slide.bgColor} flex items-center justify-center`}
          >
            <div className="max-w-4xl mx-auto px-8 text-center">
              <h2
                className={`text-6xl md:text-7xl font-bold mb-6 ${slide.textColor} animate-fade-in`}
              >
                {slide.title}
              </h2>
              <p
                className={`text-3xl md:text-4xl mb-4 ${slide.textColor} animate-fade-in-delay-1`}
              >
                {slide.subtitle}
              </p>
              <p
                className={`text-xl md:text-2xl mb-8 ${slide.textColor} opacity-90 animate-fade-in-delay-2`}
              >
                {slide.description}
              </p>
              {slide.buttonText && (
                <button className="px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg animate-fade-in-delay-3 cursor-pointer">
                  {slide.buttonText}
                </button>
              )}
              {slide.id === 1 && (
                <div className="mt-6 animate-fade-in-delay-3">
                  <span className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full text-lg font-mono">
                    WELCOME20
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-8 top-1/2 -translate-y-1/2 p-3 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full transition-all z-10 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-3 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full transition-all z-10 cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-8 h-8 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'w-12 bg-white'
                : 'w-3 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
