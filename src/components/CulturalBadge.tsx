import { cn } from "@/lib/utils";

interface CulturalBadgeProps {
  type: "country" | "language-native" | "language-learning" | "interest";
  children: React.ReactNode;
  className?: string;
  flag?: string;
}

export const CulturalBadge = ({ type, children, className, flag }: CulturalBadgeProps) => {
  const baseClasses = {
    country: "badge-country",
    "language-native": "badge-language-native", 
    "language-learning": "badge-language-learning",
    interest: "bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-sm font-medium"
  };

  return (
    <span className={cn(baseClasses[type], className)}>
      {flag && <span className="mr-2">{flag}</span>}
      {children}
    </span>
  );
};