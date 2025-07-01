import React from "react";

const learnGroupLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="-mx-6">
      <main className="lg:mt-[-8px] md:h-[calc(100vh-70px)] overflow-hidden bg-background">
        {children}
      </main>
    </div>
  );
};

export default learnGroupLayout;
