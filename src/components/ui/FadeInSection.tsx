
import React, { useEffect, useRef, useState, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  direction?: "up" | "right" | "left" | "none";
  style?: CSSProperties;
}

const FadeInSection: React.FC<FadeInSectionProps> = ({
  children,
  className = "",
  delay = 0,
  threshold = 0.1,
  direction = "up",
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = domRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            if (current) observer.unobserve(current);
          }
        });
      },
      { threshold }
    );

    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [delay, threshold]);

  const animationClass = () => {
    switch (direction) {
      case "up":
        return "animate-fade-in-up";
      case "right":
        return "animate-slide-in-right";
      case "left":
        return "animate-slide-in-left";
      case "none":
        return "animate-fade-in";
      default:
        return "animate-fade-in-up";
    }
  };

  return (
    <div
      ref={domRef}
      className={cn(
        isVisible ? animationClass() : "opacity-0",
        className
      )}
      style={{ 
        transitionDelay: `${delay}ms`, 
        willChange: "opacity, transform",
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default FadeInSection;
