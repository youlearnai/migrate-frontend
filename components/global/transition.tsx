export default function Transition({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="lg:animate-fade-in-up">{children}</div>;
}
