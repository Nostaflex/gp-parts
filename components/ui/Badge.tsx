import { cn } from '@/lib/utils';
import { Check, AlertTriangle, XCircle, Tag } from 'lucide-react';
import type { ReactNode } from 'react';

type BadgeVariant = 'in-stock' | 'low-stock' | 'out-of-stock' | 'promo' | 'category';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, { classes: string; icon: ReactNode | null }> = {
  'in-stock': {
    classes: 'bg-caribbean/10 text-caribbean',
    icon: <Check size={14} strokeWidth={2} />,
  },
  'low-stock': {
    classes: 'bg-warning/10 text-warning',
    icon: <AlertTriangle size={14} strokeWidth={1.75} />,
  },
  'out-of-stock': {
    classes: 'bg-basalt/10 text-basalt',
    icon: <XCircle size={14} strokeWidth={1.75} />,
  },
  promo: {
    classes: 'bg-volcanic text-white',
    icon: <Tag size={14} strokeWidth={2} />,
  },
  category: {
    classes: 'bg-lin text-basalt',
    icon: null,
  },
};

export function Badge({ variant, children, className }: BadgeProps) {
  const { classes, icon } = VARIANTS[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-body font-medium',
        classes,
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
