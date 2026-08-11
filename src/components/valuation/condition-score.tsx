"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ConditionGrade = "A+" | "A" | "B+" | "B" | "C" | "D";

export interface ConditionScoreProps {
  score: number;
  grade?: ConditionGrade;
  label?: string;
  className?: string;
  size?: number;
}

function gradeFromScore(score: number): ConditionGrade {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 78) return "B+";
  if (score >= 68) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function ConditionScore({
  score,
  grade,
  label = "Condition",
  className,
  size = 140,
}: ConditionScoreProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, score));
  const resolvedGrade = grade ?? gradeFromScore(clamped);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size / 2 + stroke }}>
        <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
          <path
            d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-secondary"
            strokeLinecap="round"
          />
          <motion.path
            d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
            fill="none"
            stroke="url(#conditionGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={reduceMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
            }
          />
          <defs>
            <linearGradient id="conditionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1B4DFF" />
              <stop offset="100%" stopColor="#B8FF3C" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="font-display text-3xl font-bold leading-none">{Math.round(clamped)}</span>
          <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            Grade {resolvedGrade}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground-muted">{label}</p>
    </div>
  );
}
