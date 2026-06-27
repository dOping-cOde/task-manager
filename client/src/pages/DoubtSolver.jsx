import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FiSend, FiCpu, FiUser, FiSquare, FiTrash2, FiCopy, FiCheck, FiImage, FiX,
} from "react-icons/fi";

import { CATEGORIES } from "../lib/constants";
import Markdown from "../components/Markdown";

// Read the JWT the same way the axios instance does.
const authToken = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.token || "";
  } catch {
    return "";
  }
};

const SUBJECTS = ["Any", ...CATEGORIES.map((c) => c.value)];
const MAX_IMAGES = 4;

// Downscale + recompress a screenshot to keep uploads small (and fast/cheap).
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = Math.min(MAX / width, MAX / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const DoubtSolver = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("Any");
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState([]); // [{ id, url }]
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stop = () => abortRef.current?.abort();

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    if (attachments.length >= MAX_IMAGES) {
      toast.error(`Up to ${MAX_IMAGES} images`);
      return;
    }
    for (const f of files.slice(0, MAX_IMAGES - attachments.length)) {
      try {
        const url = await compressImage(f);
        setAttachments((prev) =>
          prev.length >= MAX_IMAGES ? prev : [...prev, { id: ++idRef.current, url }]
        );
      } catch {
        toast.error("Couldn't read that image");
      }
    }
  };

  const removeAttachment = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  // Let students paste a screenshot straight into the box.
  const onPaste = (e) => {
    const imgs = Array.from(e.clipboardData?.items || [])
      .filter((it) => it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (imgs.length) {
      e.preventDefault();
      addFiles(imgs);
    }
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || streaming) return;

    const userMsg = { role: "user", content: text, images: attachments.map((a) => a.url) };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/doubt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken()}`,
        },
        body: JSON.stringify({
          messages: history,
          subject: subject === "Any" ? undefined : subject,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "Something went wrong");
      }
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content) {
          last.content = err.name === "AbortError" ? "_(stopped)_" : "Sorry, I hit an error.";
        }
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = Boolean(input.trim()) || attachments.length > 0;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            <FiCpu className="text-brand-600" /> AI Doubt Solver
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ask a question or paste a screenshot — get step-by-step explanations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              title="Clear conversation"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="card flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-slate-400">
            <div>
              <FiCpu className="mx-auto mb-3 text-4xl" />
              <p className="font-medium">Ask your first doubt</p>
              <p className="text-sm">
                Type a question, or paste / attach a screenshot of the problem.
              </p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`group flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              }`}
            >
              {m.role === "user" ? <FiUser /> : <FiCpu />}
            </div>
            <div
              className={`flex max-w-[80%] flex-col gap-1 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {m.images?.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.images.map((src, idx) => (
                    <a key={idx} href={src} target="_blank" rel="noreferrer">
                      <img
                        src={src}
                        alt="attachment"
                        className="max-h-44 max-w-[12rem] rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </a>
                  ))}
                </div>
              )}

              {(m.content || m.role === "assistant") && (
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "whitespace-pre-wrap bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {m.content ? (
                    m.role === "assistant" ? (
                      <Markdown>{m.content}</Markdown>
                    ) : (
                      m.content
                    )
                  ) : (
                    <span className="inline-flex gap-1">
                      <Dot /> <Dot /> <Dot />
                    </span>
                  )}
                </div>
              )}

              {m.role === "assistant" && m.content && <CopyButton text={m.content} />}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="mt-4">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div key={a.id} className="relative">
                <img
                  src={a.url}
                  alt="to send"
                  className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                />
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-700 text-white shadow hover:bg-slate-900"
                  title="Remove"
                >
                  <FiX className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Attach image"
          >
            <FiImage />
          </button>

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder="Type your question, or paste a screenshot…  (Enter to send)"
            className="input-field max-h-40 flex-1 resize-none"
          />

          {streaming ? (
            <button
              onClick={stop}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white hover:bg-red-600"
              title="Stop"
            >
              <FiSquare />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!canSend}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              title="Send"
            >
              <FiSend />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Dot = () => (
  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-slate-400 opacity-0 transition hover:text-slate-600 focus:opacity-100 group-hover:opacity-100 dark:hover:text-slate-200"
      title="Copy answer"
    >
      {copied ? (
        <>
          <FiCheck className="text-emerald-500" /> Copied
        </>
      ) : (
        <>
          <FiCopy /> Copy
        </>
      )}
    </button>
  );
};

export default DoubtSolver;
