import { useEffect, useRef, useState } from "react";

/**
 * Progressively reveal a long list as the user scrolls (keeps the DOM light
 * even with thousands of items), YouTube-style.
 *
 * @param items     the already-filtered array to page through
 * @param pageSize  how many to reveal per step
 * @param resetKey  changes to this value reset the window back to page 1
 *                  (pass your filter/search signature). Content changes to
 *                  `items` alone do NOT reset, so completing/editing an item
 *                  won't snap the list back to the top.
 *
 * Returns the slice to render, a `hasMore` flag, and a `sentinelRef` to place
 * at the bottom of the list.
 */
export default function useInfiniteScroll(items, { pageSize = 15, resetKey } = {}) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef(null);

  // Reset only when the filter/search signature changes.
  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);

  // Re-create the observer whenever `count` changes. On observe(), the browser
  // fires the callback once with the CURRENT intersection state — so if the
  // sentinel is still in view after a load, it immediately loads the next page,
  // chaining until the viewport (+ prefetch margin) is filled. This is what
  // makes a fresh page appear instantly instead of needing a scroll nudge.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => (c < items.length ? c + pageSize : c));
        }
      },
      { rootMargin: "800px 0px" } // prefetch well before the user hits bottom
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, pageSize, count]);

  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    sentinelRef,
  };
}
