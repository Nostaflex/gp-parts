import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProduct, mockPromoProduct, mockOutOfStockProduct } from '@/tests/fixtures';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock useCart hook
const mockAddItem = vi.fn();
vi.mock('@/components/cart/CartProvider', () => ({
  useCart: () => ({ addItem: mockAddItem }),
}));

// Mock useToast hook
const mockShowToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('ProductCard', () => {
  beforeEach(() => {
    mockAddItem.mockClear();
    mockShowToast.mockClear();
  });

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<ProductCard product={mockProduct} />);
    // 4500 cents = 45,00 €
    expect(screen.getByText(/45[\s,.]00/)).toBeInTheDocument();
  });

  it('shows promo badge when priceOriginal exists', () => {
    render(<ProductCard product={mockPromoProduct} />);
    // Promo percentage: ((6000 - 4500) / 6000) * 100 = 25%
    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it('shows "Indisponible" and disables button when out of stock', () => {
    render(<ProductCard product={mockOutOfStockProduct} />);
    const button = screen.getByRole('button', { name: /Indisponible/i });
    expect(button).toBeDisabled();
  });

  it('calls addItem on button click when in stock', () => {
    render(<ProductCard product={mockProduct} />);
    const button = screen.getByRole('button', { name: /Ajouter au panier/i });
    fireEvent.click(button);
    expect(mockAddItem).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('shows toast message on add to cart', () => {
    render(<ProductCard product={mockProduct} />);
    const button = screen.getByRole('button', { name: /Ajouter au panier/i });
    fireEvent.click(button);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: expect.stringContaining(mockProduct.name),
      })
    );
  });

  it('does not call addItem when button is disabled', () => {
    render(<ProductCard product={mockOutOfStockProduct} />);
    const button = screen.getByRole('button', { name: /Indisponible/i });
    fireEvent.click(button);
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('renders original price struck through when on promo', () => {
    render(<ProductCard product={mockPromoProduct} />);
    // Should show both prices
    const priceElements = screen.getAllByText(/60[\s,.]00/);
    expect(priceElements.length).toBeGreaterThan(0);
  });
});
