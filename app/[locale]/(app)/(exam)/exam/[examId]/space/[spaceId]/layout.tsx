import React from "react";

const ExamGroupLayout = async ({ children }: { children: React.ReactNode }) => {
  return <main className="bg-background">{children}</main>;
};

export default ExamGroupLayout;
