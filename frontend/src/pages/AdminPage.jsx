import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminPage() {
  const [trades, setTrades] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function fetchTrades() {
    try {
      const res = await axios.get('/admin/trades');
      setTrades(res.data.trades);
    } catch (err) {
      setError('Failed to fetch trades');
    }
  }

  useEffect(() => {
    fetchTrades();
  }, []);

  async function markReceived(id, amount) {
    setMessage(null);
    setError(null);
    let otp = null;
    if (parseFloat(amount) > 500) {
      otp = prompt('Enter OTP for high‑value transaction');
      if (!otp) return;
    }
    try {
      await axios.post(`/admin/trades/${id}/mark-received`, { otp });
      setMessage('Trade updated');
      fetchTrades();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trade');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Admin Panel</h2>
      {message && <p className="text-green-600 mb-2">{message}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-3 text-sm">User</th>
            <th className="py-2 px-3 text-sm">Crypto</th>
            <th className="py-2 px-3 text-sm">Fiat</th>
            <th className="py-2 px-3 text-sm">Fee</th>
            <th className="py-2 px-3 text-sm">State</th>
            <th className="py-2 px-3 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2 px-3 text-sm">{t.user_id.slice(0, 8)}…</td>
              <td className="py-2 px-3 text-sm">{t.from_currency}</td>
              <td className="py-2 px-3 text-sm">${t.amount_fiat}</td>
              <td className="py-2 px-3 text-sm">${t.fee_usd}</td>
              <td className="py-2 px-3 text-sm">{t.state}</td>
              <td className="py-2 px-3 text-sm">
                {t.state !== 'COMPLETED' && (
                  <button onClick={() => markReceived(t.id, t.amount_fiat)} className="text-blue-600 underline">Mark received</button>
                )}
              </td>
            </tr>
          ))}
          {trades.length === 0 && (
            <tr>
              <td colSpan="6" className="py-4 text-center text-sm text-gray-600">No trades found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;