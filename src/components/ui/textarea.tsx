import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow,background-color] outline-none placeholder:text-slate-400 focus-visible:border-sitk-yellow focus-visible:ring-4 focus-visible:ring-sitk-yellow/35 focus-visible:shadow-[0_0_0_1px_rgba(251,191,36,0.35)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
