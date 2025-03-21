import React from "react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  value: number;
  max: number;
  className?: string;
  color?: string;
}

export function ProgressIndicator({
  value,
  max,
  className,
  color = "bg-primary",
}: ProgressIndicatorProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  // Determine color based on percentage
  let dynamicColor = color;
  if (!color || color === "auto") {
    if (percentage > 90) {
      dynamicColor = "bg-red-500"; // Danger
    } else if (percentage > 75) {
      dynamicColor = "bg-amber-500"; // Warning
    } else {
      dynamicColor = "bg-primary"; // Normal
    }
  }

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2.5", className)}>
      <div
        className={cn(`${dynamicColor} h-2.5 rounded-full`)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
