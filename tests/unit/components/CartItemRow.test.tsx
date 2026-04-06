import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { mockCartItem } from '@/tests/fixtures';

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
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
vi.mock('@/components/cart/CartProvider', () => ({
  useCart: () => ({
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
  }),
}));

describe('CartItemRow', () => {
  beforeEach(() => {
    mockUpdateQuantity.mockClear();
    mockRemoveItem.mockClear();
  });

  it('renders item name', () => {
    render(<CartItemRow item={mockCartItem} />);
    expect(screen.getByText(mockCartItem.name)).toBeInTheDocument();
  });

  it('renders item reference', () => {
    render(<CartItemRow item={mockCartItem} />);
    expect(screen.getByText(mockCartItem.reference)).toBeInTheDocument();
  });

  it('renders formatted subtotal', () => {
    render(<CartItemRow item={mockCartItem} />);
    // mockCartItem: price 4500 cents, quantity 2 = 9000 cents = 90,00 €
    expect(screen.getByText(/90[\s,.]00/)).toBeInTheDocument();
  });

  it('calls updateQuantity when plus button is clicked', () => {
    render(<CartItemRow item={mockCartItem} />);
    const plusButton = screen.getByRole('button', { name: /Augmenter la quantité/i });
    fireEvent.click(plusButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith(mockCartItem.id, mockCartItem.quantity + 1);
  });

  it('calls updateQuantity when minus button is clicked', () => {
    render(<CartItemRow item={mockCartItem} />);
    const minusButton = screen.getByRole('button', { name: /Diminuer la quantité/i });
    fireEvent.click(minusButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith(mockCartItem.id, mockCartItem.quantity - 1);
  });

  it('disables minus button when quantity is 1', () => {
    const singleItem = { ...mockCartItem, quantity: 1 };
    render(<CartItemRow item={singleItem} />);
    const minusButton = screen.getByRole('button', { name: /Diminuer la quantité/i });
    expect(minusButton).toBeDisabled();
  });

  it('disables plus button when quantity equals stock', () => {
    const maxedItem = { ...mockCartItem, quantity: mockCartItem.stock };
    render(<CartItemRow item={maxedItem} />);
    const plusButton = screen.getByRole('button', { name: /Augmenter la quantité/i });
    expect(plusButton).toBeDisabled();
  });

  it('calls removeItem when delete button is clicked', () => {
    render(<CartItemRow item={mockCartItem} />);
    const deleteButton = screen.getByRole('button', {
      name: new RegExp(`Supprimer ${mockCartItem.name}`),
    });
    fireEvent.click(deleteButton);
    expect(mockRemoveItem).toHaveBeenCalledWith(mockCartItem.id);
  });

  it('shows price per unit when quantity > 1', () => {
    const multiItem = { ...mockCartItem, quantity: 3 };
    render(<CartItemRow item={multiItem} />);
    // Should show both subtotal and per-unit price
    const priceElements = screen.getAllByText(/45[\s,.]00/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('does not show price per unit when quantity is 1', () => {
    const singleItem = { ...mockCartItem, quantity: 1 };
    render(<CartItemRow item={singleItem} />);
    // Should show only subtotal price, not the per-unit line
    expect(screen.queryByText(/unité/)).not.toBeInTheDocument();
  });
});
