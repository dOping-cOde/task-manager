import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiCheckCircle, FiCheckSquare, FiCalendar, FiClock, FiFileText,
  FiTarget, FiBookOpen, FiBarChart2, FiAward, FiBell, FiUser,
  FiSettings, FiLogOut, FiMenu, FiX, FiSun, FiMoon, FiChevronLeft, FiCoffee,
  FiGrid, FiCpu, FiMessageSquare, FiZap, FiTrendingUp, FiRepeat, FiHash, FiList,
} from "react-icons/fi";

import { logout } from "../features/auth/authSlice";
import { clearTasks } from "../features/tasks/tasksSlice";
import { resetGamification, fetchStats } from "../features/gamification/gamificationSlice";
import { toggleTheme, toggleSidebar, setMobileSidebar } from "../features/ui/uiSlice";
import { fetchNotifications } from "../features/notifications/notificationsSlice";
import XpBar from "./XpBar";
import RewardWatcher from "./RewardWatcher";
import MotivationPopup from "./MotivationPopup";

const NAV = [
  { to: "/", label: "Tasks", icon: FiCheckSquare, end: true },
  { to: "/calendar", label: "Calendar", icon: FiCalendar },
  { to: "/wall", label: "Study Wall", icon: FiGrid },
  { to: "/timer", label: "Study Timer", icon: FiClock },
  { to: "/mock-tests", label: "Mock Tests", icon: FiFileText },
  { to: "/goals", label: "Goals", icon: FiTarget },
  { to: "/challenges", label: "21-Day Challenge", icon: FiZap },
  { to: "/year-tracker", label: "365 Days", icon: FiTrendingUp },
  { to: "/notes", label: "Notes", icon: FiBookOpen },
  { to: "/syllabus", label: "Syllabus Tracker", icon: FiList },
  { to: "/revisions", label: "Revision", icon: FiRepeat },
  { to: "/maths-kit", label: "Maths Kit", icon: FiHash },
  { to: "/planner", label: "AI Planner", icon: FiCpu },
  { to: "/doubt-solver", label: "AI Doubt Solver", icon: FiMessageSquare },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/progress", label: "Progress", icon: FiAward },
  { to: "/recharge", label: "Recharge", icon: FiCoffee },
];
const SECONDARY = [
  { to: "/notifications", label: "Notifications", icon: FiBell },
  { to: "/profile", label: "Profile", icon: FiUser },
  { to: "/settings", label: "Settings", icon: FiSettings },
];

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const streak = useSelector((s) => s.gamification.streak.current);
  const theme = useSelector((s) => s.ui.theme);
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useSelector((s) => s.ui.mobileSidebarOpen);
  const notifications = useSelector((s) => s.notifications.items);
  const unread = notifications.filter((n) => !n.read).length;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Close profile menu on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearTasks());
    dispatch(resetGamification());
    toast.success("Logged out");
    navigate("/login");
  };

  const initial = user?.name?.charAt(0).toUpperCase() || "?";
  const showPopup = user?.preferences?.motivationPopups !== false;

  const NavSection = ({ items }) =>
    items.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={() => dispatch(setMobileSidebar(false))}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            isActive
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          } ${collapsed ? "lg:justify-center" : ""}`
        }
        title={label}
      >
        <Icon className="shrink-0 text-lg" />
        <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
        {label === "Notifications" && unread > 0 && (
          <span className={`ml-auto rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ${collapsed ? "lg:hidden" : ""}`}>
            {unread}
          </span>
        )}
      </NavLink>
    ));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <RewardWatcher />
      {showPopup && <MotivationPopup />}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => dispatch(setMobileSidebar(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-950
          ${collapsed ? "lg:w-20" : "lg:w-64"} w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white">
            <FiCheckCircle className="text-lg" />
          </div>
          <span className={`text-lg font-bold tracking-tight text-slate-900 dark:text-white ${collapsed ? "lg:hidden" : ""}`}>
            Task<span className="text-brand-600">Flow</span>
          </span>
          <button
            onClick={() => dispatch(setMobileSidebar(false))}
            className="ml-auto text-slate-400 lg:hidden"
          >
            <FiX />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavSection items={NAV} />
          <div className="my-3 border-t border-slate-100 dark:border-slate-800" />
          <NavSection items={SECONDARY} />
        </nav>

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="hidden items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 lg:flex"
        >
          <FiChevronLeft className={`transition ${collapsed ? "rotate-180" : ""}`} />
          <span className={collapsed ? "lg:hidden" : ""}>Collapse</span>
        </button>

        <div
          className={`border-t border-slate-200 px-4 py-3 text-center text-[11px] text-slate-400 dark:border-slate-800 ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          Designed by{" "}
          <a
            href="https://www.facebook.com/profile.php?id=100035490324230"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Arun Kumar
          </a>
        </div>
      </aside>

      {/* Main column */}
      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 sm:px-6">
          <button
            onClick={() => dispatch(setMobileSidebar(true))}
            className="text-slate-500 dark:text-slate-300 lg:hidden"
          >
            <FiMenu className="text-xl" />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <XpBar />

            <div
              className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              title={`${streak}-day streak`}
            >
              🔥 {streak}
            </div>

            <button
              onClick={() => dispatch(toggleTheme())}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>

            <button
              onClick={() => navigate("/notifications")}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Notifications"
            >
              <FiBell />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {/* Profile menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 sm:block">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 animate-scale-in rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <MenuLink to="/profile" icon={FiUser} onClick={() => setMenuOpen(false)}>
                    Profile
                  </MenuLink>
                  <MenuLink to="/settings" icon={FiSettings} onClick={() => setMenuOpen(false)}>
                    Settings
                  </MenuLink>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-slate-700"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const MenuLink = ({ to, icon: Icon, children, onClick }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        onClick?.();
        navigate(to);
      }}
      className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <Icon /> {children}
    </button>
  );
};

export default Layout;