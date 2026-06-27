import { useEffect, useRef, useState } from "react";

/**
 * Progressively reveal a long list as the user scrolls (keeps the DOM light
 * even when there are thousands of items).
 *
 * Pass the already-filtered array; you get back the slice to render, a
 * `hasMore` flag, and a `sentinelRef` to drop at the bottom of the list.
 * The visible count resets whenever the list identity changes (e.g. filters).
 */
export default function useInfiniteScroll(items, { pageSize = 15 } = {}) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef(null);

  // Reset to the first page when the underlying list changes (filter/search).
  useEffect(() => {
    setCount(pageSize);
  }, [items, pageSize]);

  // Load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => (c < items.length ? c + pageSize : c));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, pageSize]);

  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    sentinelRef,
  };
}
