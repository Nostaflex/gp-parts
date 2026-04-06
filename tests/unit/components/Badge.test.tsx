import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children content', () => {
    render(<Badge variant="in-stock">En stock</Badge>);
    expect(screen.getByText('En stock')).toBeInTheDocument();
  });

  it('renders in-stock variant with correct styling', () => {
    const { container } = render(<Badge variant="in-stock">En stock</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-caribbean/10', 'text-caribbean');
  });

  it('renders low-stock variant with correct styling', () => {
    const { container } = render(<Badge variant="low-stock">Plus que 3</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-warning/10', 'text-warning');
  });

  it('renders out-of-stock variant with correct styling', () => {
    const { container } = render(<Badge variant="out-of-stock">Rupture</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-basalt/10', 'text-basalt');
  });

  it('renders promo variant with correct styling', () => {
    const { container } = render(<Badge variant="promo">-25%</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-volcanic', 'text-white');
  });

  it('renders category variant with correct styling', () => {
    const { container } = render(<Badge variant="category">Freinage</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-lin', 'text-basalt');
  });

  it('applies base badge classes to all variants', () => {
    const { container } = render(<Badge variant="in-stock">Test</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'gap-1',
      'rounded-full',
      'px-3',
      'py-1',
      'text-caption',
      'font-body',
      'font-medium'
    );
  });

  it('accepts custom className prop', () => {
    const { container } = render(
      <Badge variant="in-stock" className="custom-class">
        Test
      </Badge>
    );
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders with icon for in-stock variant', () => {
    const { container } = render(<Badge variant="in-stock">En stock</Badge>);
    // Check for SVG icon element
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with icon for low-stock variant', () => {
    const { container } = render(<Badge variant="low-stock">Plus que 3</Badge>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with icon for out-of-stock variant', () => {
    const { container } = render(<Badge variant="out-of-stock">Rupture</Badge>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with icon for promo variant', () => {
    const { container } = render(<Badge variant="promo">-25%</Badge>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not render icon for category variant', () => {
    const { container } = render(<Badge variant="category">Freinage</Badge>);
    const badge = container.querySelector('span');
    const icon = badge?.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });
});
