// Exciting, high-energy grind quotes injected into every email so each one
// lands with a fresh push to act and finish the task.
export const QUOTES = [
  "While you scrolled, someone solved their 50th question. MOVE.",
  "Comfort is the enemy of selection. Open the book. NOW.",
  "Your rank won't change while you rest. Get back to the grind.",
  "Excuses don't clear cut-offs. Effort does. Pick up the pen.",
  "Somewhere a topper is practicing what you're avoiding. Catch up.",
  "Tired? Good. That's the weak version of you dying. Keep going.",
  "You don't want it bad enough until it hurts. Make it hurt.",
  "Every question skipped is a mark gifted to your competition.",
  "Motivation fades. Discipline clears exams. Sit. Solve. Repeat.",
  "The exam doesn't care about your mood. Show up anyway.",
  "Average effort gets average ranks. You didn't come here to be average.",
  "Sleep later. Selection first. The grind is non-negotiable.",
  "Lakhs are fighting for your seat. Out-work every single one.",
  "Your future self is begging you to study right now. Listen.",
  "No shortcuts. No mercy. Just questions, accuracy, and speed.",
  "Pain of discipline or pain of regret — choose before the result does.",
  "One more set. One more revision. That's how ranks are built.",
  "The clock is running. The syllabus isn't shrinking. GRIND.",
  "Winners revise what losers postpone. Which one are you today?",
  "Cut-offs rise every year. So should your effort. Push harder.",
  "Talent is overrated. Relentless practice is undefeated.",
  "Stop waiting to feel ready. Start. Momentum beats mood.",
  "Mock score low? Good. Now you know what to destroy today.",
  "Hard work beats luck when luck gets lazy. Don't get lazy.",
  "Your dream job won't apply for itself. Earn it, question by question.",
  "Be ruthless with your time. The exam will be ruthless with you.",
  "Today's sweat is tomorrow's salary slip. Keep grinding.",
  "Champions train when no one's watching. Train anyway.",
  "Stop romanticizing the result. Fall in love with the reps.",
  "If it were easy, everyone would clear it. So out-grind them.",
];

// Random quote for emails (each send gets a fresh one).
export const getRandomQuote = () =>
  QUOTES[Math.floor(Math.random() * QUOTES.length)];