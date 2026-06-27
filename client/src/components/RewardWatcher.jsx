import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

import { clearReward, fetchStats } from "../features/gamification/gamificationSlice";
import { ACHIEVEMENTS } from "../lib/achievements";

const fireConfetti = (big) => {
  const base = { spread: 70, startVelocity: 45, ticks: 200, zIndex: 9999 };
  confetti({ ...base, particleCount: big ? 160 : 80, origin: { y: 0.7 } });
  if (big) {
    // A celebratory double-burst from the corners for level-ups.
    setTimeout(
      () =>
        confetti({
          ...base,
          particleCount: 120,
          angle: 60,
          origin: { x: 0, y: 0.8 },
        }),
      150
    );
    setTimeout(
      () =>
        confetti({
          ...base,
          particleCount: 120,
          angle: 120,
          origin: { x: 1, y: 0.8 },
        }),
      300
    );
  }
};

/**
 * Watches gamification.lastReward and celebrates: confetti, XP toast,
 * level-up + achievement toasts, then refreshes stats from the server.
 */
const RewardWatcher = () => {
  const dispatch = useDispatch();
  const reward = useSelector((s) => s.gamification.lastReward);

  useEffect(() => {
    if (!reward) return;

    fireConfetti(reward.leveledUp || reward.unlocked?.length > 0);

    // XP gained
    const onTime = reward.onTime ? ` (incl. +${reward.onTimeBonus} on-time)` : "";
    toast.success(`+${reward.xpGained} XP${onTime}`, { icon: "✨" });

    // Level up
    if (reward.leveledUp) {
      toast.success(`Level up! You're now level ${reward.level} 🎉`, {
        duration: 5000,
        style: {
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          color: "#fff",
          fontWeight: 600,
        },
      });
    }

    // Newly unlocked achievements
    reward.unlocked?.forEach((key) => {
      const meta = ACHIEVEMENTS[key];
      if (meta) {
        toast(`Achievement unlocked: ${meta.title}`, {
          icon: meta.emoji,
          duration: 5000,
        });
      }
    });

    // Authoritative refresh, then clear the transient reward.
    dispatch(fetchStats());
    dispatch(clearReward());
  }, [reward, dispatch]);

  return null;
};

export default RewardWatcher;