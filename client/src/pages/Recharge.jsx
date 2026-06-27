import { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  FiPlay, FiPause, FiRotateCcw, FiAward, FiCoffee,
  FiVolume2, FiVolumeX, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

// --- Snake game (pure frontend, Web Audio sound effects) ---
const GRID = 20; // cells per side
const CELL = 20; // px per cell  -> canvas 400x400
const SIZE = GRID * CELL;
const START_SPEED = 150; // ms per tick
const MIN_SPEED = 70;
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const Recharge = () => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Mutable game state (kept in refs so the tick loop doesn't re-render).
  const snake = useRef([{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }]);
  const dir = useRef(DIRS.right);
  const nextDir = useRef(DIRS.right);
  const food = useRef({ x: 14, y: 10 });
  const speed = useRef(START_SPEED);
  const runningRef = useRef(false);
  const overRef = useRef(false);
  const loopRef = useRef(null);
  const scoreRef = useRef(0);
  const mutedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(Number(localStorage.getItem("snakeBest")) || 0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  // --- Sound (synthesized, no files) ---
  const beep = useCallback((freq, dur = 0.08, type = "square", vol = 0.06) => {
    if (mutedRef.current || !audioRef.current) return;
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, []);

  const ensureAudio = () => {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    audioRef.current?.resume?.();
  };

  // --- Drawing ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dark = document.documentElement.classList.contains("dark");

    ctx.fillStyle = dark ? "#0f172a" : "#f1f5f9";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // subtle grid
    ctx.strokeStyle = dark ? "#1e293b" : "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, SIZE);
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(SIZE, i * CELL);
      ctx.stroke();
    }

    // food
    const f = food.current;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // snake
    snake.current.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#4f46e5" : "#6366f1";
      const pad = i === 0 ? 1 : 2;
      roundRect(ctx, seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5);
      ctx.fill();
    });
  }, []);

  const spawnFood = () => {
    let p;
    do {
      p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.current.some((s) => s.x === p.x && s.y === p.y));
    food.current = p;
  };

  const reset = useCallback(() => {
    snake.current = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir.current = DIRS.right;
    nextDir.current = DIRS.right;
    speed.current = START_SPEED;
    scoreRef.current = 0;
    overRef.current = false;
    spawnFood();
    setScore(0);
    setOver(false);
    draw();
  }, [draw]);

  const endGame = useCallback(() => {
    overRef.current = true;
    runningRef.current = false;
    clearTimeout(loopRef.current);
    setRunning(false);
    setOver(true);
    // descending "game over" tones
    beep(300, 0.12, "sawtooth", 0.08);
    setTimeout(() => beep(200, 0.16, "sawtooth", 0.08), 120);
    setTimeout(() => beep(120, 0.22, "sawtooth", 0.08), 300);

    setBest((b) => {
      const nb = Math.max(b, scoreRef.current);
      localStorage.setItem("snakeBest", String(nb));
      return nb;
    });
  }, [beep]);

  const tick = useCallback(() => {
    // commit queued direction (ignore direct reversal)
    const d = nextDir.current;
    if (!(d.x === -dir.current.x && d.y === -dir.current.y)) dir.current = d;

    const head = {
      x: snake.current[0].x + dir.current.x,
      y: snake.current[0].y + dir.current.y,
    };

    // wall or self collision
    if (
      head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
      snake.current.some((s) => s.x === head.x && s.y === head.y)
    ) {
      endGame();
      return;
    }

    const ate = head.x === food.current.x && head.y === food.current.y;
    const body = [head, ...snake.current];
    if (ate) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      beep(660 + scoreRef.current * 8, 0.07, "square", 0.07);
      spawnFood();
      if (speed.current > MIN_SPEED && scoreRef.current % 3 === 0) speed.current -= 6;
    } else {
      body.pop();
    }
    snake.current = body;
    draw();
  }, [beep, draw, endGame]);

  // The self-scheduling loop (so speed can change dynamically).
  const loop = useCallback(() => {
    if (!runningRef.current) return;
    tick();
    if (runningRef.current && !overRef.current) {
      loopRef.current = setTimeout(loop, speed.current);
    }
  }, [tick]);

  const start = () => {
    ensureAudio();
    if (overRef.current) reset();
    if (!started) setStarted(true);
    runningRef.current = true;
    setRunning(true);
    clearTimeout(loopRef.current);
    loopRef.current = setTimeout(loop, speed.current);
  };

  const pause = () => {
    runningRef.current = false;
    setRunning(false);
    clearTimeout(loopRef.current);
  };

  const restart = () => {
    pause();
    reset();
    start();
  };

  const turn = (name) => {
    nextDir.current = DIRS[name];
  };

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const name = map[e.key];
      if (name) {
        e.preventDefault();
        turn(name);
        if (!runningRef.current && !overRef.current) start();
      } else if (e.key === " ") {
        e.preventDefault();
        runningRef.current ? pause() : start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial draw + cleanup.
  useEffect(() => {
    reset();
    return () => clearTimeout(loopRef.current);
  }, [reset]);

  // Confetti on a new high score.
  useEffect(() => {
    if (over && score > 0 && score >= best && score !== 0) {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, zIndex: 9999 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const toggleMute = () => {
    setMuted((m) => {
      mutedRef.current = !m;
      return !m;
    });
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <FiCoffee className="text-brand-600" /> Recharge — Snake
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Feeling low? Grab a few apples, reset your brain, then back to the grind. 🐍🔋
        </p>
      </div>

      {/* Scoreboard */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Score <span className="text-brand-600">{score}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-amber-600 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <FiAward /> {best}
          </div>
        </div>
        <button
          onClick={toggleMute}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <FiVolumeX /> : <FiVolume2 />}
        </button>
      </div>

      {/* Board */}
      <div className="relative mx-auto" style={{ maxWidth: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="w-full rounded-2xl border border-slate-200 shadow-md dark:border-slate-700"
          style={{ touchAction: "none", imageRendering: "pixelated" }}
        />

        {/* Overlay: start / game over */}
        {(!started || over) && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-900/60 text-center backdrop-blur-sm">
            <div>
              {over ? (
                <>
                  <p className="text-3xl font-extrabold text-white">Game Over</p>
                  <p className="mt-1 text-slate-200">
                    Score {score}
                    {score >= best && score > 0 ? " · New best! 🎉" : ""}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-extrabold text-white">Snake</p>
              )}
              <button
                onClick={start}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 font-bold text-white shadow-lg transition hover:bg-brand-700"
              >
                <FiPlay /> {over ? "Play again" : "Start"}
              </button>
              <p className="mt-3 text-xs text-slate-300">
                Arrow keys / WASD to move · Space to pause
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {running ? (
            <button onClick={pause} className="btn-ghost border border-slate-200 dark:border-slate-700">
              <FiPause /> Pause
            </button>
          ) : (
            <button onClick={start} className="btn-primary">
              <FiPlay /> {over ? "Restart" : started ? "Resume" : "Start"}
            </button>
          )}
          <button onClick={restart} className="btn-ghost border border-slate-200 dark:border-slate-700">
            <FiRotateCcw /> Restart
          </button>
        </div>

        {/* On-screen D-pad (mobile) */}
        <div className="grid grid-cols-3 gap-1 sm:hidden">
          <span />
          <DPad onClick={() => turn("up")} icon={FiChevronUp} />
          <span />
          <DPad onClick={() => turn("left")} icon={FiChevronLeft} />
          <DPad onClick={() => turn("down")} icon={FiChevronDown} />
          <DPad onClick={() => turn("right")} icon={FiChevronRight} />
        </div>
      </div>
    </div>
  );
};

const DPad = ({ onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm active:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
  >
    <Icon />
  </button>
);

// rounded-rect helper for canvas
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default Recharge;