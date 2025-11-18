import React from 'react';
import { X, Zap, Check } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice } from '../../lib/stripe';
import './UpgradePrompt.scss';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  currentPlan?: string;
  onUpgrade: (planId: string) => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  reason,
  currentPlan = 'free',
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const availablePlans = Object.values(SUBSCRIPTION_PLANS).filter(
    (plan) => plan.id !== currentPlan && plan.id !== 'free'
  );

  return (
    <div className="upgrade-prompt-overlay" onClick={onClose}>
      <div className="upgrade-prompt" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upgrade-prompt__header">
          <div className="upgrade-prompt__title">
            <Zap className="upgrade-prompt__icon" />
            <h2>Upgrade Required</h2>
          </div>
          <button className="upgrade-prompt__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Reason */}
        <div className="upgrade-prompt__reason">
          <p>{reason}</p>
        </div>

        {/* Plans */}
        <div className="upgrade-prompt__plans">
          {availablePlans.map((plan) => (
            <div key={plan.id} className="upgrade-prompt__plan">
              <div className="upgrade-prompt__plan-header">
                <h3>{plan.name}</h3>
                <div className="upgrade-prompt__plan-price">
                  <span className="upgrade-prompt__plan-amount">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="upgrade-prompt__plan-period">/month</span>
                </div>
              </div>

              <p className="upgrade-prompt__plan-description">{plan.description}</p>

              <ul className="upgrade-prompt__plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className="upgrade-prompt__plan-button"
                onClick={() => onUpgrade(plan.id)}
              >
                Upgrade to {plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="upgrade-prompt__footer">
          <button className="upgrade-prompt__cancel" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
