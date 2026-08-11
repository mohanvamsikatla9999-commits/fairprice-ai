import { FairValueCard } from "@/components/valuation/fair-value-card";
import { PriceMeter, type PriceMeterZone } from "@/components/valuation/price-meter";
import { ConditionScore } from "@/components/valuation/condition-score";
import { AiInsightCard, type AiInsightCardProps } from "@/components/valuation/ai-insight-card";
import { DemandIndicator, type DemandLevel } from "@/components/valuation/demand-indicator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ValuationReportProps {
  productName: string;
  sellerPrice: number;
  fairLow: number;
  fairHigh: number;
  recommendedListing: number;
  expectedSelling: number;
  quickSale: number;
  confidence: number;
  demand: DemandLevel;
  conditionScore: number;
  zone?: PriceMeterZone;
  insights?: AiInsightCardProps[];
  className?: string;
}

export function ValuationReport({
  productName,
  sellerPrice,
  fairLow,
  fairHigh,
  recommendedListing,
  expectedSelling,
  quickSale,
  confidence,
  demand,
  conditionScore,
  zone,
  insights = [],
  className,
}: ValuationReportProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-border bg-white shadow-xl",
        className,
      )}
    >
      <div className="hero-blue px-6 py-6 text-white sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge className="mb-2 border-0 bg-accent text-accent-foreground">
              FairPrice Report
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {productName}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Neutral market estimate based on recent comparable sales.
            </p>
          </div>
          <DemandIndicator level={demand} className="bg-white/15 text-white border-white/20" />
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-6">
          <PriceMeter
            sellerPrice={sellerPrice}
            fairLow={fairLow}
            fairHigh={fairHigh}
            zone={zone}
          />
          <Separator />
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold">AI insights</h3>
            {insights.length > 0 ? (
              insights.map((insight) => (
                <AiInsightCard key={insight.title} {...insight} />
              ))
            ) : (
              <AiInsightCard
                title="Pricing context"
                body="List near the recommended price for a balanced chance of a timely sale without leaving money on the table."
                tone="tip"
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <FairValueCard
            fairLow={fairLow}
            fairHigh={fairHigh}
            recommendedListing={recommendedListing}
            expectedSelling={expectedSelling}
            quickSale={quickSale}
            confidence={confidence}
            demand={demand}
          />
          <div className="flex justify-center rounded-2xl border border-border bg-background-muted/60 p-6">
            <ConditionScore score={conditionScore} />
          </div>
        </div>
      </div>
    </section>
  );
}
