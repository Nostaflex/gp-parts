import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-volcanic text-white hover:bg-[#E64500] active:bg-[#CC3D00] active:scale-[0.98] focus-visible:ring-volcanic',
  secondary:
    'bg-basalt text-cream hover:bg-[#2A2826] active:scale-[0.98] focus-visible:ring-basalt',
  outline:
    'bg-transparent text-basalt border border-basalt hover:bg-basalt/5 active:bg-basalt/10 active:scale-[0.98] focus-visible:ring-basalt',
  ghost:
    'bg-transparent text-volcanic hover:underline active:text-[#CC3D00] focus-visible:ring-volcanic',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-body-sm px-4 py-2',
  md: 'text-body px-6 py-3 font-medium',
  lg: 'text-body-lg px-8 py-4 font-medium',
};

/**
 * Helper partagé — retourne les classes CSS d'un bouton.
 * Utilisé par <Button> et <ButtonLink> pour garantir un visuel identique
 * sans produire de HTML invalide (un <a> ne peut pas contenir un <button>).
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-body transition-all duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Lien visuellement identique à un Button mais rendu comme un <a> (via next/link).
 * À utiliser partout où un clic doit déclencher une navigation — jamais
 * <Link><Button /></Link>, qui produit du HTML invalide (<a><button/></a>).
 */
type ButtonLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...linkProps}
    >
      {children}
    </Link>
  );
}
