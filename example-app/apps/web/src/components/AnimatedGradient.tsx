import { useEffect, useState } from "react";

export const AnimatedGradient = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-soft/40 blur-3xl animate-float"
        style={{
          transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`,
        }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-soft/40 blur-3xl animate-float"
        style={{
          animationDelay: "-3s",
          transform: `translate(${mousePos.x * -0.015}px, ${mousePos.y * -0.015}px)`,
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse-soft"
        style={{ animationDelay: "-1.5s" }}
      />
    </div>
  );
};
