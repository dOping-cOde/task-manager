import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders Markdown (the format the AI replies in) as clean, formatted content.
 * Uses Tailwind's typography plugin for sensible defaults, tuned compact for
 * chat bubbles and made dark-mode aware.
 */
const Markdown = ({ children }) => (
  <div
    className="prose prose-sm max-w-none break-words dark:prose-invert
      prose-headings:mb-1 prose-headings:mt-3 prose-headings:font-bold
      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
      prose-p:my-1.5 prose-p:leading-relaxed
      prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
      prose-strong:text-slate-900 dark:prose-strong:text-white
      prose-a:text-brand-600 dark:prose-a:text-brand-400
      prose-code:rounded prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5
      prose-code:text-brand-700 prose-code:before:content-[''] prose-code:after:content-['']
      dark:prose-code:bg-white/10 dark:prose-code:text-brand-300
      prose-pre:bg-slate-900 prose-pre:text-slate-100
      prose-hr:my-3 prose-table:text-xs"
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  </div>
);

export default Markdown;
