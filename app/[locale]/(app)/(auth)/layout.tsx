import React from "react";

const personalFormLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="w-full">
      <main className="w-full">{children}</main>
    </div>
  );
};

export default personalFormLayout;
