"use client";

import { useState, type ComponentProps } from "react";
import { Icon } from "../Icon";

/** Password field with a show/hide toggle, so long passwords can be checked on a phone. */
export function PasswordInput({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return <span className="relative block">
    <input {...props} type={visible ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false}
      className={`control pr-14 ${className}`} />
    <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}
      className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-secondary transition duration-fast hover:bg-ink/[0.05] hover:text-ink">
      <Icon name={visible ? "eye-off" : "eye"} className="h-5 w-5" />
    </button>
  </span>;
}
