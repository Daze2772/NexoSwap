import React, { useState } from 'react';
import axios from 'axios';

const cryptoOptions = ['BTC', 'ETH', 'USDT', 'USDC'];
const fiatMethods = ['PayPal', 'Zelle', 'Venmo', 'Wise'];

function calculateFee(amount) {
  const rate = amount < 200 ? 0.05 : 0.025;
  return Math.round((amount * rate + Number.EPSILON) * 100) / 100;
}

function TradeCreatePage() {
  const [form, setForm] = useState({ from_currency: 'BTC', to_currency: 'USD', amount_fiat: '', fiat_method: 'PayPal' });
  const [fee, setFee] = useState(0);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (name === 'amount_fiat') {
      const amt = parseFloat(value) || 0;
      setFee(calculateFee(amt));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const payload = {
        from_currency: form.from_currency,
        to_currency: form.to_currency,
        amount_fiat: parseFloat(form.amount_fiat),
        fiat_method: form.fiat_method
      };
      const res = await axios.post('/trades', payload);
      setMessage('Trade created successfully');
      setForm({ ...form, amount_fiat: '' });
      setFee(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Trade creation failed');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded">
      <h2 className="text-xl font-semibold mb-4">Create Trade</h2>
      {message && <p className="text-green-600 mb-2">{message}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Crypto Currency</label>
          <select name="from_currency" value={form.from_currency} onChange={handleChange} className="w-full border border-gray-300 rounded p-2">
            {cryptoOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fiat Method</label>
          <select name="fiat_method" value={form.fiat_method} onChange={handleChange} className="w-full border border-gray-300 rounded p-2">
            {fiatMethods.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount (USD)</label>
          <input type="number" name="amount_fiat" value={form.amount_fiat} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
        </div>
        <div>
          <p className="text-sm text-gray-600">Fee: <span className="font-medium">${fee.toFixed(2)}</span></p>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Submit Trade</button>
      </form>
    </div>
  );
}

export default TradeCreatePage;