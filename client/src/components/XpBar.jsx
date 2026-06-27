import { useSelector } from "react-redux";

// Compact level + XP progress indicator for the navbar.
const XpBar = () => {
  const { level, xpIntoLevel, xpForLevelSpan, progressPct } = useSelector(
    (s) => s.gamification
  );

  return (
    <div className="hidden items-center gap-3 md:flex">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-bold text-white shadow">
        {level}
      </div>
      <div className="w-32">
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span>Level {level}</span>
          <span>
            {xpIntoLevel}/{xpForLevelSpan}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default XpBar;