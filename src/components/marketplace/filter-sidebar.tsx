"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FilterSidebarValues {
  minPrice?: string;
  maxPrice?: string;
  conditions: string[];
  fairOnly: boolean;
  verifiedOnly: boolean;
}

export interface FilterSidebarProps {
  value?: FilterSidebarValues;
  onChange?: (value: FilterSidebarValues) => void;
  onApply?: (value: FilterSidebarValues) => void;
  onReset?: () => void;
  className?: string;
}

const CONDITIONS = ["Like New", "Excellent", "Good", "Fair", "Needs Repair"];

const DEFAULT_VALUE: FilterSidebarValues = {
  minPrice: "",
  maxPrice: "",
  conditions: [],
  fairOnly: false,
  verifiedOnly: false,
};

export function FilterSidebar({
  value,
  onChange,
  onApply,
  onReset,
  className,
}: FilterSidebarProps) {
  const [local, setLocal] = React.useState<FilterSidebarValues>(value ?? DEFAULT_VALUE);

  React.useEffect(() => {
    if (value) setLocal(value);
  }, [value]);

  function update(next: FilterSidebarValues) {
    setLocal(next);
    onChange?.(next);
  }

  function toggleCondition(condition: string) {
    const exists = local.conditions.includes(condition);
    update({
      ...local,
      conditions: exists
        ? local.conditions.filter((c) => c !== condition)
        : [...local.conditions, condition],
    });
  }

  return (
    <aside
      className={cn(
        "w-full rounded-2xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:w-72",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLocal(DEFAULT_VALUE);
            onReset?.();
          }}
        >
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="mb-2 block">Price range (₹)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              inputMode="numeric"
              placeholder="Min"
              value={local.minPrice}
              onChange={(e) => update({ ...local, minPrice: e.target.value })}
            />
            <Input
              inputMode="numeric"
              placeholder="Max"
              value={local.maxPrice}
              onChange={(e) => update({ ...local, maxPrice: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label className="mb-3 block">Condition</Label>
          <div className="space-y-2.5">
            {CONDITIONS.map((condition) => (
              <label key={condition} className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={local.conditions.includes(condition)}
                  onCheckedChange={() => toggleCondition(condition)}
                />
                {condition}
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={local.fairOnly}
              onCheckedChange={(checked) =>
                update({ ...local, fairOnly: checked === true })
              }
            />
            Fair-priced only
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={local.verifiedOnly}
              onCheckedChange={(checked) =>
                update({ ...local, verifiedOnly: checked === true })
              }
            />
            Verified sellers
          </label>
        </div>

        <Button className="w-full" onClick={() => onApply?.(local)}>
          Apply filters
        </Button>
      </div>
    </aside>
  );
}
