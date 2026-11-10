import React, { useState, useEffect } from 'react';
import {
  Check,
  Zap,
  Sparkles,
  Building2,
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useSubscriptionStore, SUBSCRIPTION_PLANS } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';
import { useToast } from '../ui/Toast';
import { SubscriptionPlanId } from '../../types';

export const PlanUpgradeModal: React.FC = () => {
  const { subscription, upgradePlan } = useSubscriptionStore();
  const { activeModal, closeModal, modalPayload } = useUiStore();
  const isUpgradeModalOpen = activeModal === 'upgrade';
  const upgradeModalFeatureTrigger = modalPayload?.trigger || modalPayload;
  const toast = useToast();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanId | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Card details state for simulated Stripe checkout
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('888');

  useEffect(() => {
    if (
      modalPayload?.targetPlan &&
      modalPayload.targetPlan !== subscription.planId &&
      modalPayload.targetPlan !== 'free'
    ) {
      setSelectedPlanForCheckout(modalPayload.targetPlan);
    }
  }, [modalPayload?.targetPlan, subscription.planId]);

  if (!isUpgradeModalOpen) return null;

  const handleClose = () => {
    setSelectedPlanForCheckout(null);
    setCheckoutComplete(false);
    setIsProcessing(false);
    closeModal();
  };

  const handleStartUpgrade = (planId: SubscriptionPlanId, instant = true) => {
    if (planId === subscription.planId) return;

    if (instant || planId === 'free') {
      upgradePlan(planId);
      toast.success(
        `🎉 Switched to ${SUBSCRIPTION_PLANS[planId]?.name || planId.toUpperCase()}! All features are unlocked.`
      );
      handleClose();
      return;
    }

    setSelectedPlanForCheckout(planId);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    upgradePlan(selectedPlanForCheckout);
    toast.success(
      `🎉 You're now on the ${SUBSCRIPTION_PLANS[selectedPlanForCheckout]?.name || selectedPlanForCheckout.toUpperCase()} plan!`
    );
    handleClose();
  };

  const plans = [
    {
      id: 'free' as SubscriptionPlanId,
      name: 'Free Plan',
      monthlyPrice: '$0',
      annualPrice: '$0',
      period: 'forever',
      description: 'Ideal for freelance solopreneurs starting out.',
      features: [
        'Up to 5 invoices per month',
        'Minimal invoice template',
        'Basic inventory tracking',
        'Local browser storage backup',
      ],
      highlight: false,
    },
    {
      id: 'starter' as SubscriptionPlanId,
      name: 'Starter Plan',
      monthlyPrice: '$15',
      annualPrice: '$12',
      period: '/month',
      description: 'For growing businesses and professional freelancers.',
      features: [
        'Up to 50 invoices & clients',
        'Minimal & Classic invoice templates',
        'Online Payment Links & Card Portal',
        'Custom Business Branding & Logo',
        'Multi-currency support',
        'Automated payment reminders',
      ],
      highlight: true,
      badge: 'Most Popular',
    },
    {
      id: 'business' as SubscriptionPlanId,
      name: 'Business Plan',
      monthlyPrice: '$39',
      annualPrice: '$31',
      period: '/month',
      description: 'Full power for agencies, teams, and high-volume operators.',
      features: [
        'Unlimited invoices & team seats',
        'All 3 templates (Minimal, Classic, Modern)',
        'Multi-business management',
        'Multi-currency & exchange rate feeds',
        'Custom domain payment portal',
        'REST API & Webhooks access',
      ],
      highlight: false,
    },
  ];

  const checkoutPlanObj = plans.find((p) => p.id === selectedPlanForCheckout);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 2: CHECKOUT & PAYMENT */}
        {selectedPlanForCheckout && checkoutPlanObj ? (
          <div className="max-w-md mx-auto py-4">
            <button
              onClick={() => setSelectedPlanForCheckout(null)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all plans</span>
            </button>

            {checkoutComplete ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Upgrade Successful!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your workspace is now upgraded to <strong>{checkoutPlanObj.name}</strong>. All premium
                  features and unlimited limits are immediately active.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayment} className="space-y-5">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 text-[#FF7916] text-xs font-bold mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secure Checkout</span>
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Activate {checkoutPlanObj.name} Plan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Instant activation with 30-day money-back guarantee.
                  </p>
                </div>

                {/* Plan summary pill */}
                <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {checkoutPlanObj.name} Plan ({billingCycle === 'annual' ? 'Annual' : 'Monthly'})
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Billed {billingCycle === 'annual' ? 'yearly (Save 20%)' : 'monthly'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-extrabold text-[#FF7916]">
                      {billingCycle === 'annual'
                        ? checkoutPlanObj.annualPrice
                        : checkoutPlanObj.monthlyPrice}
                    </span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>

                {/* Card input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-[#FF7916] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs shadow-md shadow-[#FF7916]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      Confirm & Upgrade to {checkoutPlanObj.name} (
                      {billingCycle === 'annual'
                        ? checkoutPlanObj.annualPrice
                        : checkoutPlanObj.monthlyPrice}
                      /mo)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      upgradePlan(checkoutPlanObj.id);
                      toast.success(`🎉 Workspace upgraded to ${checkoutPlanObj.name}!`);
                      handleClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    ⚡ Instant Demo Activate (Skip Card Form)
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Encrypted 256-bit SSL transaction • Powered by Stripe & Cloud</span>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STEP 1: PLAN COMPARISON */
          <>
            {/* Modal Header */}
            <div className="text-center max-w-xl mx-auto mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 text-[#FF7916] text-xs font-bold mb-3 border border-orange-200 dark:border-orange-900/60">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>SaaS Subscription Plans</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Unlock the Full Power of EgolePay
              </h2>
              {upgradeModalFeatureTrigger ? (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 py-1.5 px-3 rounded-xl border border-amber-200 dark:border-amber-900/50 inline-block">
                  {upgradeModalFeatureTrigger}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Upgrade your workspace to access unlimited invoices, cloud synchronization, and online client payments.
                </p>
              )}

              {/* Billing Cycle Toggle */}
              <div className="mt-5 inline-flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Annual billing</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrent = subscription.planId === plan.id;
                const displayPrice =
                  billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                      plan.highlight
                        ? 'border-[#FF7916] bg-orange-50/20 dark:bg-orange-950/20 shadow-lg shadow-orange-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FF7916] text-white text-[11px] font-bold shadow-xs">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="my-5 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                          {displayPrice}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                      </div>

                      <ul className="space-y-2.5 mb-6 text-xs text-slate-600 dark:text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartUpgrade(plan.id, true)}
                        disabled={isCurrent}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : plan.highlight
                            ? 'bg-[#FF7916] hover:bg-[#ea580c] text-white shadow-md shadow-[#FF7916]/25'
                            : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : `Activate ${plan.name} (1-Click)`}
                      </button>

                      {!isCurrent && plan.id !== 'free' && (
                        <button
                          type="button"
                          onClick={() => handleStartUpgrade(plan.id, false)}
                          className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1"
                        >
                          Simulate Stripe Checkout →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
