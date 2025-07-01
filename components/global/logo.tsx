"use client";
import { LogoProps } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const Logo = ({ size = "sm", height, width, clickable = true }: LogoProps) => {
  const pathname = usePathname();
  const params = useParams();

  const imageProps = {
    draggable: false,
    priority: true,
  };

  const largeLogo = (
    <>
      <Image
        src="/youlearn.png"
        alt="youlearn-logo"
        className="dark:hidden"
        width={width || 30}
        height={height || 30}
        {...imageProps}
      />
      <Image
        src="/youlearn-dark.png"
        alt="youlearn-logo"
        className="hidden dark:block"
        width={width || 30}
        height={height || 30}
        {...imageProps}
      />
    </>
  );

  const smallLogo = (
    <>
      <Image
        src="/youlearn-full.png"
        alt="youlearn-logo"
        className="dark:hidden"
        width={width || 110}
        height={height || 110}
        {...imageProps}
      />
      <Image
        src="/youlearn-full-dark.png"
        alt="youlearn-logo"
        className="hidden dark:block"
        width={width || 110}
        height={height || 110}
        {...imageProps}
      />
    </>
  );

  const content = size === "lg" ? largeLogo : smallLogo;

  if (!clickable) {
    return <div className="w-fit">{content}</div>;
  }

  const getHref = () => {
    if (
      params.spaceId &&
      (pathname.includes("/learn/") || pathname.includes("/exam/"))
    ) {
      return `/space/${params.spaceId}`;
    }
    return `/`;
  };

  return (
    <Link href={getHref()} className="w-fit">
      {content}
    </Link>
  );
};

export default Logo;
