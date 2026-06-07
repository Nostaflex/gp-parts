'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStripePromise } from '@/lib/stripe-client';

const stripePromise = getStripePromise();

interface CardPaymentFormProps {
  clientSecret: string;
  /** Appelé quand le paiement est confirmé (succeeded / processing). */
  onPaid: () => void;
}

function PaymentInner({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    // redirect: 'if_required' → la plupart des cartes test confirment sans
    // redirection ; on enchaîne côté client. Le 3DS éventuel utilise return_url.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commande/confirmation`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Le paiement a échoué. Réessayez.');
      setPaying(false);
      return;
    }

    if (
      paymentIntent &&
      (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
    ) {
      onPaid();
      return;
    }

    setError('Paiement non confirmé. Réessayez.');
    setPaying(false);
  };

  return (
    <div className="space-y-4">
      <PaymentElement />

      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
        >
          <AlertCircle size={16} strokeWidth={2} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={!stripe || paying}
        onClick={handlePay}
      >
        {paying ? 'Paiement en cours...' : 'Payer par carte'}
      </Button>

      <p className="text-xs text-cp-ink/35 text-center">
        Paiement sécurisé par Stripe
        {process.env.NODE_ENV !== 'production' && ' — mode test (carte 4242 4242 4242 4242)'}
      </p>
    </div>
  );
}

/**
 * Formulaire de paiement carte (Stripe Payment Element).
 * Monté une fois le `clientSecret` obtenu du serveur.
 */
export function CardPaymentForm({ clientSecret, onPaid }: CardPaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: 'fr',
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#E87200', borderRadius: '12px' },
        },
      }}
    >
      <PaymentInner onPaid={onPaid} />
    </Elements>
  );
}
