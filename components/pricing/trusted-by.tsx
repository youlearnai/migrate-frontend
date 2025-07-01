import initTranslations from "@/lib/i18n";
import { logos } from "@/lib/utils";
import Image from "next/image";

const TrustedBy = async ({ locale }: { locale: string }) => {
  const { t } = await initTranslations(locale, ["default"]);

  return (
    <div className="hidden lg:flex dark:hidden w-full flex-col gap-6 text-center my-16">
      <h2 className="text-sm text-neutral-500 dark:text-neutral-400">
        {t("trustedBy.heading")}
      </h2>
      <div className="flex flex-wrap justify-center items-center gap-10">
        {logos.map((logo, index) => (
          <div key={index} className="flex-shrink-0">
            <Image
              draggable={false}
              src={logo.src}
              alt={logo.alt}
              width={100}
              height={48}
              className="max-h-[70px] max-w-[120px]"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustedBy;
