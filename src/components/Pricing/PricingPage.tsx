import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice } from '../../lib/stripe';
import { useStripe } from '../../contexts/StripeContext';

interface PricingCardProps {
  plan: typeof SUBSCRIPTION_PLANS.free;
  isPopular?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

function PricingCard({ plan, isPopular = false, onSelect, loading = false }: PricingCardProps) {
  const { currentPlan } = useStripe();
  const isCurrentPlan = currentPlan.id === plan.id;
  const isFree = plan.id === 'free';

  return (
    <div className={`relative bg-white rounded-xl border-2 p-8 ${
      isPopular 
        ? 'border-primary-500 shadow-lg scale-105' 
        : 'border-secondary-200 hover:border-primary-300'
    } transition-all duration-200`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Most Popular
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-secondary-900 mb-2">{plan.name}</h3>
        <p className="text-secondary-600 mb-4">{plan.description}</p>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-secondary-900">
            {isFree ? 'Free' : formatPrice(plan.price)}
          </span>
          {!isFree && (
            <span className="text-secondary-600 ml-1">/month</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center text-secondary-700">
            <Check className="w-5 h-5 text-success-500 mr-3 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        disabled={loading || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-secondary-100 text-secondary-500 cursor-not-allowed'
            : isPopular
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200'
        }`}
      >
        {isCurrentPlan ? 'Current Plan' : isFree ? 'Get Started' : 'Upgrade'}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const { upgradeSubscription, loading } = useStripe();
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') {
      // Handle free plan selection
      console.log('Free plan selected');
      return;
    }

    try {
      setSelectedPlan(planId);
      // upgradeSubscription will redirect to Stripe checkout
      await upgradeSubscription(planId);
      // Note: The redirect happens in upgradeSubscription, so we won't reach here
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-4xl font-bold text-secondary-900">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered writing with our flexible subscription plans
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            plan={SUBSCRIPTION_PLANS.free}
            onSelect={handlePlanSelect}
            loading={loading && selectedPlan === 'free'}
          />
          
          <PricingCard
            plan={SUBSCRIPTION_PLANS.pro}
            isPopular={true}
            onSelect={handlePlanSelect}
            loading={loading && selectedPlan === 'pro'}
          />
          
          <PricingCard
            plan={SUBSCRIPTION_PLANS.premium}
            onSelect={handlePlanSelect}
            loading={loading && selectedPlan === 'premium'}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-secondary-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-secondary-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-secondary-600">
                Your data is always safe. You can export your work before canceling, and we'll keep it for 30 days.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-secondary-600">
                We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-secondary-600">
                Absolutely. We use Stripe for secure payment processing and never store your payment details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
