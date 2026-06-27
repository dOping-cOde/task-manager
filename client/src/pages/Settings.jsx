import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiSun,
  FiMoon,
  FiMonitor,
  FiTarget,
  FiClock,
  FiBell,
  FiLock,
  FiSave,
} from "react-icons/fi";

import { setTheme } from "../features/ui/uiSlice";
import { updatePreferences, changePassword } from "../features/user/userSlice";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: FiSun },
  { value: "dark", label: "Dark", icon: FiMoon },
  { value: "system", label: "System", icon: FiMonitor },
];

const Settings = () => {
  const dispatch = useDispatch();
  const prefs = useSelector((s) => s.auth.user?.preferences);
  const currentTheme = useSelector((s) => s.ui.theme);

  // --- Study goals ---
  const [goals, setGoals] = useState({
    dailyGoalHours: prefs?.dailyGoalHours ?? 4,
    dailyGoalTasks: prefs?.dailyGoalTasks ?? 5,
  });

  // --- Pomodoro ---
  const [pomodoro, setPomodoro] = useState({
    focusMin: prefs?.pomodoro?.focusMin ?? 25,
    shortBreakMin: prefs?.pomodoro?.shortBreakMin ?? 5,
    longBreakMin: prefs?.pomodoro?.longBreakMin ?? 15,
    roundsBeforeLongBreak: prefs?.pomodoro?.roundsBeforeLongBreak ?? 4,
  });

  // --- Notifications ---
  const [emailReminders, setEmailReminders] = useState(
    prefs?.emailReminders ?? true
  );
  const [motivationPopups, setMotivationPopups] = useState(
    prefs?.motivationPopups ?? true
  );

  // --- Password ---
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [changingPwd, setChangingPwd] = useState(false);

  const savePrefs = async (patch, successMsg = "Settings saved") => {
    const result = await dispatch(updatePreferences(patch));
    if (updatePreferences.fulfilled.match(result)) {
      toast.success(successMsg);
    } else {
      toast.error(result.payload || "Could not save settings");
    }
  };

  const handleTheme = (theme) => {
    dispatch(setTheme(theme));
    savePrefs({ theme }, "Theme updated");
  };

  const handleGoalsSave = (e) => {
    e.preventDefault();
    savePrefs({
      dailyGoalHours: Number(goals.dailyGoalHours),
      dailyGoalTasks: Number(goals.dailyGoalTasks),
    });
  };

  const handlePomodoroSave = (e) => {
    e.preventDefault();
    savePrefs({
      pomodoro: {
        focusMin: Number(pomodoro.focusMin),
        shortBreakMin: Number(pomodoro.shortBreakMin),
        longBreakMin: Number(pomodoro.longBreakMin),
        roundsBeforeLongBreak: Number(pomodoro.roundsBeforeLongBreak),
      },
    });
  };

  const toggleEmailReminders = () => {
    const next = !emailReminders;
    setEmailReminders(next);
    savePrefs({ emailReminders: next }, "Preference saved");
  };

  const toggleMotivationPopups = () => {
    const next = !motivationPopups;
    setMotivationPopups(next);
    savePrefs({ motivationPopups: next }, "Preference saved");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPwd(true);
    const result = await dispatch(changePassword(pwd));
    setChangingPwd(false);
    if (changePassword.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Password updated");
      setPwd({ currentPassword: "", newPassword: "" });
    } else {
      toast.error(result.payload || "Could not update password");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customise your study experience.
        </p>
      </div>

      {/* Appearance */}
      <Section title="Appearance" subtitle="Choose how CGLTracker looks.">
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = currentTheme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTheme(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="text-xl" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Study goals */}
      <Section
        title="Study goals"
        subtitle="Set your daily targets."
        icon={FiTarget}
      >
        <form onSubmit={handleGoalsSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Daily hours">
              <input
                type="number"
                min={0}
                max={24}
                value={goals.dailyGoalHours}
                onChange={(e) =>
                  setGoals((p) => ({ ...p, dailyGoalHours: e.target.value }))
                }
                className="input-field"
              />
            </Field>
            <Field label="Daily tasks">
              <input
                type="number"
                min={0}
                max={100}
                value={goals.dailyGoalTasks}
                onChange={(e) =>
                  setGoals((p) => ({ ...p, dailyGoalTasks: e.target.value }))
                }
                className="input-field"
              />
            </Field>
          </div>
          <button type="submit" className="btn-primary">
            <FiSave /> Save goals
          </button>
        </form>
      </Section>

      {/* Pomodoro */}
      <Section
        title="Pomodoro timer"
        subtitle="Tune your focus and break lengths (minutes)."
        icon={FiClock}
      >
        <form onSubmit={handlePomodoroSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Focus">
              <input
                type="number"
                min={1}
                value={pomodoro.focusMin}
                onChange={(e) =>
                  setPomodoro((p) => ({ ...p, focusMin: e.target.value }))
                }
                className="input-field"
              />
            </Field>
            <Field label="Short break">
              <input
                type="number"
                min={1}
                value={pomodoro.shortBreakMin}
                onChange={(e) =>
                  setPomodoro((p) => ({ ...p, shortBreakMin: e.target.value }))
                }
                className="input-field"
              />
            </Field>
            <Field label="Long break">
              <input
                type="number"
                min={1}
                value={pomodoro.longBreakMin}
                onChange={(e) =>
                  setPomodoro((p) => ({ ...p, longBreakMin: e.target.value }))
                }
                className="input-field"
              />
            </Field>
            <Field label="Rounds before long break">
              <input
                type="number"
                min={1}
                value={pomodoro.roundsBeforeLongBreak}
                onChange={(e) =>
                  setPomodoro((p) => ({
                    ...p,
                    roundsBeforeLongBreak: e.target.value,
                  }))
                }
                className="input-field"
              />
            </Field>
          </div>
          <button type="submit" className="btn-primary">
            <FiSave /> Save timer
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section
        title="Notifications"
        subtitle="Control what reaches you."
        icon={FiBell}
      >
        <div className="space-y-3">
          <Toggle
            label="Email reminders"
            description="Get a digest of your pending tasks by email."
            checked={emailReminders}
            onChange={toggleEmailReminders}
          />
          <Toggle
            label="Motivation popups"
            description="Show celebratory popups when you hit milestones."
            checked={motivationPopups}
            onChange={toggleMotivationPopups}
          />
        </div>
      </Section>

      {/* Change password */}
      <Section
        title="Change password"
        subtitle="Use at least 6 characters."
        icon={FiLock}
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field label="Current password">
            <input
              type="password"
              value={pwd.currentPassword}
              onChange={(e) =>
                setPwd((p) => ({ ...p, currentPassword: e.target.value }))
              }
              required
              placeholder="••••••••"
              className="input-field"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              value={pwd.newPassword}
              onChange={(e) =>
                setPwd((p) => ({ ...p, newPassword: e.target.value }))
              }
              required
              minLength={6}
              placeholder="••••••••"
              className="input-field"
            />
          </Field>
          <button type="submit" disabled={changingPwd} className="btn-primary">
            {changingPwd ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <>
                <FiLock /> Update password
              </>
            )}
          </button>
        </form>
      </Section>
    </div>
  );
};

const Section = ({ title, subtitle, icon: Icon, children }) => (
  <div className="card p-6">
    <div className="mb-4 flex items-start gap-3">
      {Icon && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <Icon />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    {children}
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "left-[1.375rem]" : "left-0.5"
        }`}
      />
    </button>
  </div>
);

export default Settings;