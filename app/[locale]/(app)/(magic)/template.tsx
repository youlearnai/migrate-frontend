import Hero from "@/components/home/hero";

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
  }>,
) {
  const { children } = props;

  return (
    <>
      <Hero />
      <div className="md:mx-0">{children}</div>
    </>
  );
}
