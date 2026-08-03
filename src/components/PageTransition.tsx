// src/components/PageTransition.tsx
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setVisible(false);
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setVisible(true);
      }, 220);
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-40"
      }`}
    >
      {children}
    </div>
  );
}