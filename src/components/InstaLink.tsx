import React from "react";
import { BUSINESS } from "@/lib/business";

// Our Instagram handle as a link. Pass children to change the link text.
export default function InstaLink({ children, className = "underline hover:text-brand-orange" }: { children?: React.ReactNode; className?: string }) {
  return (
    <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? `@${BUSINESS.instagramHandle}`}
    </a>
  );
}
