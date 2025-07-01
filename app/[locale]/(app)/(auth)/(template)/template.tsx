import Logo from "@/components/global/logo";
import Transition from "@/components/global/transition";

export default async function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full mt-12 md:mt-24 text-center w-full flex items-center flex-col justify-center">
      <div className="mb-6">
        <Logo size="lg" />
      </div>
      <Transition>{children}</Transition>
    </div>
  );
}
