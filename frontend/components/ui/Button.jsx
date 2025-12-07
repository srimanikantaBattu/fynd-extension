
import React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default:
        "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow active:scale-95 transition-all text-sm font-medium",
      outline:
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
      ghost:
        "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
      link: "text-indigo-600 underline-offset-4 hover:underline",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200"
    };

    const sizes = {
      default: "h-10 px-5 py-2", // Increased horizontal padding
      sm: "h-9 rounded-md px-3",
      lg: "h-12 rounded-lg px-8 text-base", // Larger button
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
