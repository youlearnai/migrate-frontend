import DiscountPricingBanner from "@/components/pricing/discount-pricing-banner";
import FAQ from "@/components/pricing/faq";
import TrustedBy from "@/components/pricing/trusted-by";
import Upgrade from "@/components/pricing/upgrade";

const UpgradePage = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  return (
    <div>
      {/* <DiscountPricingBanner /> */}
      <div className="z-10 mt-2 md:mt-4 relative h-full pb-6 space-y-16">
        <Upgrade />
        <TrustedBy locale={params.locale} />
        <FAQ locale={params.locale} />
      </div>
    </div>
  );
};

export default UpgradePage;
