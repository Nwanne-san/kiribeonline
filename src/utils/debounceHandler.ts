let timeoutId: ReturnType<typeof setTimeout>;

export function debounceHandler(func: () => void, delay = 300) {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(func, delay);
}
