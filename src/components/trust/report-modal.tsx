"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS = [
  "Suspected scam",
  "Misleading price or photos",
  "Counterfeit item",
  "Harassment",
  "Prohibited item",
  "Other",
];

export interface ReportModalProps {
  trigger?: React.ReactNode;
  listingTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (payload: { reason: string; details: string }) => void;
}

export function ReportModal({
  trigger,
  listingTitle,
  open,
  onOpenChange,
  onSubmit,
}: ReportModalProps) {
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit?.({ reason, details: details.trim() });
      setReason("");
      setDetails("");
      onOpenChange?.(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report listing</DialogTitle>
          <DialogDescription>
            {listingTitle
              ? `Help us review “${listingTitle}”. Reports are confidential.`
              : "Help us keep FairPrice AI safe. Reports are confidential."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">Details</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share what looked off — prices, messages, photos..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!reason || submitting}>
              {submitting ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
