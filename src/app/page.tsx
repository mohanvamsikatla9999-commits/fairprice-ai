import { Hero } from "@/components/home/hero";
import { ProblemSolution } from "@/components/home/problem-solution";
import { HowItWorks } from "@/components/home/how-it-works";
import { Features } from "@/components/home/features";
import { CategoriesShowcase } from "@/components/home/categories-showcase";
import { TrustSection } from "@/components/home/trust-section";
import { Testimonials } from "@/components/home/testimonials";
import { Stats } from "@/components/home/stats";
import { CtaBand } from "@/components/home/cta-band";
import { CityDeals } from "@/components/home/city-deals";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <CityDeals />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <CategoriesShowcase />
      <TrustSection />
      <Testimonials />
      <CtaBand />
    </>
  );
}
