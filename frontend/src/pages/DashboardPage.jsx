import React, { useEffect, useState } from 'react';
import axios from 'axios';

function DashboardPage({ user }) {
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const res = await axios.get('/trades');
        setTrades(res.data.trades);
      } catch (err) {
        setError('Failed to load trades');
      }
    }
    fetchTrades();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Welcome, {user.name}</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <h3 className="text-xl font-semibold mb-2">Your Trades</h3>
      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-3 text-left text-sm font-medium">ID</th>
            <th className="py-2 px-3 text-left text-sm font-medium">From</th>
            <th className="py-2 px-3 text-left text-sm font-medium">To</th>
            <th className="py-2 px-3 text-left text-sm font-medium">Fiat</th>
            <th className="py-2 px-3 text-left text-sm font-medium">Fee (USD)</th>
            <th className="py-2 px-3 text-left text-sm font-medium">State</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2 px-3 text-xs">{t.id.slice(0, 8)}…</td>
              <td className="py-2 px-3 text-sm">{t.from_currency}</td>
              <td className="py-2 px-3 text-sm">{t.to_currency}</td>
              <td className="py-2 px-3 text-sm">${t.amount_fiat}</td>
              <td className="py-2 px-3 text-sm">${t.fee_usd}</td>
              <td className="py-2 px-3 text-sm">{t.state}</td>
            </tr>
          ))}
          {trades.length === 0 && (
            <tr>
              <td colSpan="6" className="py-4 text-center text-sm text-gray-600">No trades yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DashboardPage;