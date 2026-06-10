import { useRef, useState } from "react";

interface UseDebounceParams<T> {
  initialValue: T | undefined;
  debounceMs: number;
}

const useDebounce = <T = unknown,>({
  initialValue,
  debounceMs,
}: UseDebounceParams<T>) => {
  const [currentInput, setCurrentInput] = useState<T | undefined>(initialValue);
  const lastTimeout = useRef<number | undefined>(undefined);

  const debounceNewValue = (newValue: T) => {
    if (lastTimeout.current) clearTimeout(lastTimeout.current);
    lastTimeout.current = setTimeout(() => {
      setCurrentInput(newValue);
    }, debounceMs);
  };

  return {
    value: currentInput,
    setValue: debounceNewValue,
  };
};

export default useDebounce;
