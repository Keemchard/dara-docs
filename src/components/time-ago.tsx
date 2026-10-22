"use client";

import { useState, useEffect } from "react";

function computeTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function TimeAgo({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(computeTimeAgo(date));
  }, [date]);

  return <span className={className}>{text}</span>;
}
