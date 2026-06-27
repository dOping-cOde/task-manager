// Ruthless, no-excuses grind quotes for SSC CGL aspirants.
// Intense and pushy by design — but constructive: about effort, not self-harm.
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
  "Stop scrolling motivation. BE the motivation. Solve a set.",
  "Your future self is begging you to study right now. Listen.",
  "No shortcuts. No mercy. Just questions, accuracy, and speed.",
  "Pain of discipline or pain of regret — choose before the result does.",
  "One more set. One more revision. That's how ranks are built.",
  "The clock is running. The syllabus isn't shrinking. GRIND.",
  "Winners revise what losers postpone. Which one are you today?",
  "You promised yourself this. Don't let comfort make you a liar.",
  "Cut-offs rise every year. So should your effort. Push harder.",
  "Talent is overrated. Relentless practice is undefeated.",
  "Stop waiting to feel ready. Start. Momentum beats mood.",
  "Distractions are stealing your selection. Take it back. Focus.",
  "Mock score low? Good. Now you know what to destroy today.",
  "The grind is boring. So is failing the exam. Pick your boredom.",
  "Hard work beats luck when luck gets lazy. Don't get lazy.",
  "Your dream job won't apply for itself. Earn it, question by question.",
  "Be ruthless with your time. The exam will be ruthless with you.",
  "Doubt kills more dreams than failure ever will. Solve, don't sulk.",
  "Today's sweat is tomorrow's salary slip. Keep grinding.",
  "Champions train when no one's watching. Nobody's watching. Train.",
  "Stop romanticizing the result. Fall in love with the reps.",
  "If it were easy, everyone would clear it. It's not. So out-grind them.",
];

// Return a random quote, avoiding the previously shown index.
export const getRandomQuote = (prevIndex = -1) => {
  if (QUOTES.length <= 1) return { index: 0, text: QUOTES[0] };
  let i;
  do {
    i = Math.floor(Math.random() * QUOTES.length);
  } while (i === prevIndex);
  return { index: i, text: QUOTES[i] };
};