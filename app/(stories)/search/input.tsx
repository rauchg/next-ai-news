"use client";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

export function SearchInput(props: { value?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(props.value ?? "");

  useEffect(() => {
    router.replace(`/search?q=${encodeURIComponent(value)}`);
  }, [router, value]);

  useEffect(() => {
    // check for focus and if not, focus
    if (inputRef.current && document.activeElement !== inputRef.current) {
      // focus at the end of the text
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      placeholder="Search"
      className="text-base bg-white"
      onInput={(e) => {
        setValue(e.currentTarget.value);
      }}
    />
  );
}
