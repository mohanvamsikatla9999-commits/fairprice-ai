"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CheckFairPriceButtonProps
  extends Omit<ButtonProps, "variant" | "children" | "asChild"> {
  href?: string;
  label?: string;
}

export function CheckFairPriceButton({
  href = "/value",
  label = "Check FairPrice",
  className,
  size = "lg",
  ...props
}: CheckFairPriceButtonProps) {
  const reduceMotion = useReducedMotion();

  const classes = cn(
    "relative overflow-hidden px-7 font-display text-base shadow-[0_12px_32px_rgba(184,255,60,0.4)]",
    className,
  );

  const inner = (
    <>
      <Sparkles className="h-4 w-4" />
      {label}
    </>
  );

  const button = href ? (
    <Button variant="lime" size={size} className={classes} asChild {...props}>
      <Link href={href}>{inner}</Link>
    </Button>
  ) : (
    <Button variant="lime" size={size} className={classes} {...props}>
      {inner}
    </Button>
  );

  if (reduceMotion) return button;

  return (
    <motion.div
      className="inline-flex"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      {button}
    </motion.div>
  );
}
