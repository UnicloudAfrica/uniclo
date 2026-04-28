import { useEffect, useState } from "react";

/**
 * useDebouncedValue — returns the input value after it has stopped changing
 * for `delay` ms. Use to throttle expensive filtering / search work driven
 * by an input.
 *
 * @example
 *   const [q, setQ] = useState("");
 *   const debouncedQ = useDebouncedValue(q, 200);
 *   const filtered = useMemo(() => filter(items, debouncedQ), [items, debouncedQ]);
 */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return undefined;
    }
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
