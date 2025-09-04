import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const ANIMATION_DURATION_MS = 4200;

export default function WelcomeAnimation() {
  const { isAuthenticated, user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem("ait:welcome-shown");
      if (!shown && isAuthenticated) {
        const t = setTimeout(() => {
          setVisible(true);
          setTimeout(() => {
            setVisible(false);
            try {
              sessionStorage.setItem("ait:welcome-shown", "1");
            } catch {}
          }, ANIMATION_DURATION_MS);
        }, 350);
        return () => clearTimeout(t);
      }
    } catch (e) {}
  }, [isAuthenticated]);

  if (!visible) return null;

  return (
    <div className="welcome-overlay" role="status" aria-live="polite" data-testid="welcome-overlay">
      <div className="welcome-card">
        <div className="logo-wrap">
          <img src="/logo.png" alt="AIT logo" className="welcome-logo" data-testid="welcome-logo" />
          <div className="logo-glow" aria-hidden="true" />
        </div>

        <h2 className="welcome-title">Welcome{user?.firstName ? `, ${user.firstName}` : ""}!</h2>
        <p className="welcome-sub">Thanks for joining AIT — infinite farming, smart future.</p>

        <div className="confetti-root" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className={`confetti c-${i % 6}`} />
          ))}
        </div>
      </div>
    </div>
  );
}