import { useState, useEffect, useRef } from "react";
import { FiX, FiZap } from "react-icons/fi";

import { getRandomQuote } from "../lib/quotes";

// Show a ruthless grind quote every minute. First one fires shortly after load.
const POPUP_INTERVAL_MS = 60_000;
const FIRST_DELAY_MS = 5_000;
const AUTO_HIDE_MS = 9_000;

const MotivationPopup = () => {
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState(() => getRandomQuote());
  const prevIndex = useRef(-1);
  const hideTimer = useRef(null);

  useEffect(() => {
    const trigger = () => {
      const q = getRandomQuote(prevIndex.current);
      prevIndex.current = q.index;
      setQuote(q);
      setVisible(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    };

    const first = setTimeout(trigger, FIRST_DELAY_MS);
    const interval = setInterval(trigger, POPUP_INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      clearTimeout(hideTimer.current);
    };
  }, []);

  // Keep the popup on screen while the user is reading it (hovering); resume
  // the auto-hide countdown once the pointer leaves.
  const pauseHide = () => clearTimeout(hideTimer.current);
  const resumeHide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <div
        onMouseEnter={pauseHide}
        onMouseLeave={resumeHide}
        className="pointer-events-auto w-full max-w-xl animate-slam-in overflow-hidden rounded-2xl border border-red-400/40 bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 shadow-2xl animate-pulse-glow"
      >
        <div className="flex items-start gap-3 p-5">
          <div className="grid h-11 w-11 shrink-0 animate-shake place-items-center rounded-xl bg-white/20 text-2xl">
            🔥
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-orange-100">
              <FiZap /> Grind Mode
            </div>
            <p className="mt-1 text-lg font-extrabold leading-snug text-white drop-shadow-sm">
              {quote.text}
            </p>
            <button
              onClick={() => setVisible(false)}
              className="mt-3 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              Back to work 💪
            </button>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white"
            title="Dismiss"
          >
            <FiX />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MotivationPopup;