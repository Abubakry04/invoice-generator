import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Zap, Lock } from 'lucide-react';
import { useBusinessStore } from '../../store/businessStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useUiStore } from '../../store/uiStore';

export const OrgSwitcherDropdown: React.FC = () => {
  const { businesses, activeBusinessId, setActiveBusiness, addBusiness, getActiveBusiness } =
    useBusinessStore();
  const { getCurrentPlan, hasFeature } = useSubscriptionStore();
  const { openModal } = useUiStore();

  const activeBusiness = getActiveBusiness();
  const currentPlan = getCurrentPlan();
  const canManageMultiBusiness = hasFeature('multi_business');

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    addBusiness({
      name: newBizName.trim(),
      email: 'billing@' + newBizName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com',
      phone: '+234 800 000 0000',
      address: 'Lagos, Nigeria',
      defaultCurrency: 'NGN',
      defaultTaxRate: 7.5,
      defaultPaymentTermsDays: 14,
      invoicePrefix: newBizName.trim().slice(0, 3).toUpperCase() + '-',
      accentColor: '#FF7916',
      defaultTemplate: 'modern',
    });

    setNewBizName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  const planBadgeClass =
    currentPlan.id === 'business'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      : currentPlan.id === 'starter'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
        aria-expanded={isOpen}
      >
        <div className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:text-[#FF7916] transition-colors">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] sm:max-w-[150px] truncate">
          {activeBusiness.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-auto sm:left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Switch Business / Company
          </div>

          <div className="space-y-1 my-1">
            {businesses.map((biz) => {
              const isSelected = biz.id === activeBusinessId;
              const isLocked = !isSelected && !canManageMultiBusiness;

              return (
                <button
                  key={biz.id}
                  onClick={() => {
                    if (isLocked) {
                      setIsOpen(false);
                      openModal('upgrade', {
                        targetPlan: 'business',
                        trigger: 'Switching between multiple businesses requires the Business plan.',
                      });
                      return;
                    }
                    setActiveBusiness(biz.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF7916] dark:text-orange-400 font-semibold'
                      : isLocked
                      ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{biz.name}</span>
                  </div>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-[#FF7916] shrink-0" />
                  ) : isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      Biz
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {isCreating ? (
            <form onSubmit={handleCreate} className="p-1 space-y-2">
              <input
                type="text"
                value={newBizName}
                onChange={(e) => setNewBizName(e.target.value)}
                placeholder="Business name..."
                autoFocus
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF7916]"
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2 py-1 text-[11px] rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FF7916] text-white hover:bg-[#ea580c]"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!canManageMultiBusiness) {
                  setIsOpen(false);
                  openModal('upgrade', {
                    targetPlan: 'business',
                    trigger: 'Managing multiple businesses is available exclusively on the Business Plan.',
                  });
                  return;
                }
                setIsCreating(true);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Business</span>
              </div>
              {!canManageMultiBusiness && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Business
                </span>
              )}
            </button>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              openModal('upgrade', { trigger: 'Upgrade your subscription to unlock multi-business features' });
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-[#FF7916] hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Subscription & Plans</span>
            </div>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/80 px-1.5 py-0.5 rounded font-bold">
              Upgrade
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
