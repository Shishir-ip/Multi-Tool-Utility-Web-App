import React, { useState, useMemo } from 'react';
import { ToolHeader, Button } from '../components/Shared';

// ── Discount Calculator ──
export const DiscountCalculator: React.FC = () => {
  const [price, setPrice] = useState(1000);
  const [discount, setDiscount] = useState(20);
  const saved = price * discount / 100;
  const final = price - saved;
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-percent" title="Discount Calculator" description="Calculate discounts and savings" color="#06b6d4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Original Price</label><input type="number" value={price} onChange={e => setPrice(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Discount %</label><input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(+e.target.value)} className="input-field" /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You Save</p>
          <p className="text-xl font-bold" style={{ color: '#10b981' }}>৳{saved.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Final Price</p>
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>৳{final.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Discount</p>
          <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{discount}%</p>
        </div>
      </div>
    </div>
  );
};

// ── Loan/EMI Calculator ──
export const LoanCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(5);
  const result = useMemo(() => {
    const r = rate / 12 / 100;
    const n = years * 12;
    const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - principal;
    return { emi: emi.toFixed(2), total: total.toFixed(2), interest: interest.toFixed(2) };
  }, [principal, rate, years]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-money-bill-wave" title="Loan/EMI Calculator" description="Calculate EMI and loan payments" color="#06b6d4" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Principal (৳)</label><input type="number" value={principal} onChange={e => setPrincipal(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Rate (% per year)</label><input type="number" step="0.1" value={rate} onChange={e => setRate(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Tenure (years)</label><input type="number" value={years} onChange={e => setYears(+e.target.value)} className="input-field" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly EMI</p>
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>৳{result.emi}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Interest</p>
          <p className="text-xl font-bold" style={{ color: '#ef4444' }}>৳{result.interest}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Payment</p>
          <p className="text-xl font-bold" style={{ color: '#10b981' }}>৳{result.total}</p>
        </div>
      </div>
    </div>
  );
};

// ── bKash/Nagad Cash-Out Calculator ──
export const BkashCalculator: React.FC = () => {
  const [amount, setAmount] = useState(1000);
  const [service, setService] = useState<'bkash' | 'nagad'>('bkash');
  const fees = { bkash: { cashout: 0.0149, send: 0.005 }, nagad: { cashout: 0.0149, send: 0 } };
  const fee = fees[service];
  const cashOutFee = amount * fee.cashout;
  const sendFee = amount * fee.send;
  const totalCashOut = amount + cashOutFee;
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-mobile-alt" title="bKash/Nagad Cash-Out Calculator" description="Calculate mobile banking fees" color="#06b6d4" />
      <div className="flex flex-wrap gap-2 mb-4">
        {(['bkash', 'nagad'] as const).map(s => (
          <button key={s} onClick={() => setService(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
            style={{ background: service === s ? 'var(--accent)' : 'var(--bg-tertiary)', color: service === s ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{s}</button>
        ))}
      </div>
      <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Amount (৳)</label><input type="number" value={amount} onChange={e => setAmount(+e.target.value)} className="input-field" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cash-Out Fee ({(fee.cashout * 100).toFixed(2)}%)</p>
          <p className="text-xl font-bold" style={{ color: '#ef4444' }}>৳{cashOutFee.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Send Money Fee</p>
          <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>৳{sendFee.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Cash-Out</p>
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>৳{totalCashOut.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
