// Plain, inline-styled HTML emails (email clients ignore <style> + classes).
import { getRandomQuote } from "./quotes.js";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

// A bold motivational banner — a fresh quote is drawn on every send.
const quoteBanner = () => {
  const q = getRandomQuote();
  return `
    <div style="margin:0 0 20px;padding:16px 18px;border-radius:14px;background:linear-gradient(135deg,#e11d48,#ea580c);">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#ffe4e6;">🔥 Grind Mode</div>
      <div style="margin-top:6px;font-size:16px;font-weight:800;line-height:1.35;color:#ffffff;">${escapeHtml(
        q
      )}</div>
    </div>`;
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No date";

const priorityColor = { low: "#059669", medium: "#d97706", high: "#e11d48" };

// Shared shell.
const layout = (heading, bodyHtml) => `
  <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px;">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">CGL<span style="color:#c7d2fe;">Tracker</span></span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${heading}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <a href="${APP_URL}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:10px;">Open CGLTracker</a>
        <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because you scheduled tasks in CGLTracker.</p>
      </div>
    </div>
  </div>`;

// A single task row used in the digest + confirmation.
const taskRow = (t) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
      <div style="font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(
        t.title
      )}</div>
      <div style="font-size:12px;color:#64748b;margin-top:3px;">
        <span style="color:#475569;">${escapeHtml(t.category || "General")}</span>
        &nbsp;·&nbsp;
        <span style="color:${priorityColor[t.priority] || "#64748b"};font-weight:600;text-transform:capitalize;">${t.priority}</span>
        &nbsp;·&nbsp;
        <span>${fmtDate(t.dueDate)}</span>
      </div>
    </td>
  </tr>`;

const section = (title, color, tasks) =>
  tasks.length
    ? `<p style="margin:18px 0 6px;font-size:13px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.4px;">${title} (${tasks.length})</p>
       <table style="width:100%;border-collapse:collapse;">${tasks.map(taskRow).join("")}</table>`
    : "";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Confirmation sent when a task gets scheduled (given a due date).
 */
export const scheduledTaskEmail = (user, task) => {
  const subject = `📅 Scheduled: ${task.title}`;
  const html = layout(
    `Task scheduled for ${fmtDate(task.dueDate)}`,
    `${quoteBanner()}
     <p style="font-size:14px;color:#475569;margin:0 0 12px;">Hi ${escapeHtml(
       user.name?.split(" ")[0] || "there"
     )}, your study task is on the calendar:</p>
     <table style="width:100%;border-collapse:collapse;">${taskRow(task)}</table>
     <p style="font-size:13px;color:#64748b;margin:16px 0 0;">Complete it on or before the due date to earn an on-time XP bonus. 🔥</p>`
  );
  const text = `Scheduled: ${task.title} (${task.category}, ${task.priority}) for ${fmtDate(
    task.dueDate
  )}.`;
  return { subject, html, text };
};

/**
 * Twice-daily digest of a user's pending tasks.
 * groups = { overdue, today, upcoming, noDate }
 */
export const reminderDigestEmail = (user, groups, period) => {
  const total =
    groups.overdue.length +
    groups.today.length +
    groups.upcoming.length +
    groups.noDate.length;

  const subject =
    groups.overdue.length > 0
      ? `⏰ ${groups.overdue.length} overdue · ${total} pending task${total === 1 ? "" : "s"}`
      : `📚 ${period} reminder · ${total} pending task${total === 1 ? "" : "s"}`;

  const html = layout(
    `Your ${period.toLowerCase()} study reminder`,
    `${quoteBanner()}
     <p style="font-size:14px;color:#475569;margin:0 0 4px;">Hi ${escapeHtml(
       user.name?.split(" ")[0] || "there"
     )}, here's what's still pending. Knock a few out and keep your streak alive! 🔥</p>
     ${section("Overdue", "#e11d48", groups.overdue)}
     ${section("Due today", "#4f46e5", groups.today)}
     ${section("Upcoming", "#0284c7", groups.upcoming)}
     ${section("No due date", "#64748b", groups.noDate)}`
  );

  const text = `${period} reminder: ${groups.overdue.length} overdue, ${groups.today.length} due today, ${groups.upcoming.length} upcoming, ${groups.noDate.length} unscheduled.`;
  return { subject, html, text };
};