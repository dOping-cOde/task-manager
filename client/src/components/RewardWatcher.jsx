import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

import { clearReward, fetchStats } from "../features/gamification/gamificationSlice";
import { clearJustCompleted } from "../features/tasks/tasksSlice";
import { ACHIEVEMENTS } from "../lib/achievements";

const COLORS = [
  "#6366f1", "#4f46e5", "#a855f7", "#ec4899",
  "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
];

// A thick, dense celebration: a big central burst, two corner cannons, and a
// short "rain" of confetti from the top for ~700ms.
const fireConfetti = () => {
  const base = {
    startVelocity: 50,
    ticks: 260,
    zIndex: 9999,
    scalar: 1.1,
    colors: COLORS,
  };

  confetti({ ...base, particleCount: 260, spread: 110, origin: { y: 0.65 } });
  confetti({ ...base, particleCount: 150, spread: 80, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...base, particleCount: 150, spread: 80, angle: 120, origin: { x: 1, y: 0.7 } });

  const end = Date.now() + 700;
  const rain = setInterval(() => {
    if (Date.now() > end) return clearInterval(rain);
    confetti({
      ...base,
      particleCount: 50,
      startVelocity: 35,
      spread: 120,
      origin: { x: Math.random(), y: -0.1 },
    });
  }, 100);
};

/**
 * Celebrates task completions (confetti + a floating "great job" message that
 * rises from the center and fades) and surfaces reward details (XP, level-up,
 * achievements), then refreshes stats.
 */
const RewardWatcher = () => {
  const dispatch = useDispatch();
  const reward = useSelector((s) => s.gamification.lastReward);
  const justCompleted = useSelector((s) => s.tasks.justCompleted);
  const [praise, setPraise] = useState(null); // { key }

  // Every task marked done → dense confetti + floating praise.
  useEffect(() => {
    if (!justCompleted) return;
    fireConfetti();
    setPraise({ key: justCompleted.at });
    dispatch(clearJustCompleted());
  }, [justCompleted, dispatch]);

  // Remove the praise element after its animation finishes.
  useEffect(() => {
    if (!praise) return;
    const t = setTimeout(() => setPraise(null), 2100);
    return () => clearTimeout(t);
  }, [praise]);

  // Reward details: XP gained, level-ups, achievements.
  useEffect(() => {
    if (!reward) return;

    const onTime = reward.onTime ? ` (incl. +${reward.onTimeBonus} on-time)` : "";
    toast.success(`+${reward.xpGained} XP${onTime}`, { icon: "✨" });

    if (reward.leveledUp) {
      fireConfetti(); // extra wave for the level-up
      toast.success(`Level up! You're now level ${reward.level} 🎉`, {
        duration: 5000,
        style: {
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          color: "#fff",
          fontWeight: 600,
        },
      });
    }

    reward.unlocked?.forEach((key) => {
      const meta = ACHIEVEMENTS[key];
      if (meta) {
        toast(`Achievement unlocked: ${meta.title}`, {
          icon: meta.emoji,
          duration: 5000,
        });
      }
    });

    dispatch(fetchStats());
    dispatch(clearReward());
  }, [reward, dispatch]);

  if (!praise) return null;

  // Floating, background-less praise that rises to the top and fades.
  return (
    <div
      key={praise.key}
      className="animate-praise pointer-events-none fixed left-1/2 top-1/2 z-[9999] text-center"
    >
      <p
        className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text px-4 text-3xl font-extrabold text-transparent sm:text-5xl"
        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}
      >
        Outstanding!🎉
      </p>
      <p
        className="mt-1 text-base font-bold text-emerald-600 sm:text-xl"
        style={{ filter: "drop-shadow(0 2px 6px rgba(255,255,255,0.6))" }}
      >
       Small progress today. Big success tomorrow🎯
      </p>
    </div>
  );
};

export default RewardWatcher;
