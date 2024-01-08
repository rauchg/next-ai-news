"use client";

import JSTimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { useState, useEffect } from "react";

let timeAgo: JSTimeAgo | null = null;

if (timeAgo === null) {
  JSTimeAgo.addDefaultLocale(en);
  timeAgo = new JSTimeAgo("en-US");
}

export function TimeAgo({ date, now }: { date: Date; now: number }) {
  const [_now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (timeAgo as JSTimeAgo).format(date, { now });
}
