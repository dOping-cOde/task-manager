import { FiCheckCircle } from "react-icons/fi";

// Shared split-screen shell for the Login and Signup pages.
const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left: branding panel (hidden on small screens) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative blurred orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2 text-white">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <FiCheckCircle className="text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
        </div>

        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-4xl font-extrabold leading-tight">
            Organize your day,<br />one task at a time.
          </h1>
          <p className="mt-4 text-brand-100">
            Capture what matters, set priorities, and watch your to-do list turn
            into a done list. Simple, fast, and beautifully focused.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            {[
              "Create, edit and delete tasks instantly",
              "Prioritize with low / medium / high labels",
              "Track progress with one-tap completion",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <FiCheckCircle className="shrink-0 text-brand-200" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-brand-200">
          © {new Date().getFullYear()} TaskFlow. Built with the MERN stack.
        </p>
      </div>

      {/* Right: form area */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;