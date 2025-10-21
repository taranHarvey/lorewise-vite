import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { SUBSCRIPTION_PLANS, STRIPE_CONFIG } from '../../lib/stripe';

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface CheckoutFormProps {
  planId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ planId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment method
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (cardError) {
        setError(cardError.message || 'Card error occurred');
        return;
      }

      // Create subscription on your backend
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          planId: planId,
        }),
      });

      const { subscription, error: serverError } = await response.json();

      if (serverError) {
        setError(serverError);
        return;
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(
        subscription.client_secret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#111827',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#DC2626',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-secondary-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          {plan.name} Plan
        </h3>
        <p className="text-secondary-600 mb-2">{plan.description}</p>
        <p className="text-2xl font-bold text-primary-600">
          ${plan.price}/month
        </p>
      </div>

      <div>
        <label className="label mb-2">Card Information</label>
        <div className="p-4 border border-secondary-300 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full btn bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
      </button>
    </form>
  );
}

interface StripeCheckoutProps {
  planId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripeCheckout({ planId, onSuccess, onError }: StripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        planId={planId} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
}
