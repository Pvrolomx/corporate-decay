'use client';

import { useState, useEffect } from 'react';

interface TickerResult {
  ticker: string;
  score: number;
  level: string;
  emoji: string;
  price?: {
    current: number;
    change1M: number;
    change3M: number;
    pctFromHigh: number;
    volumeRatio: number;
  };
  signals: Record<string, number>;
}

interface AnalysisResponse {
  timestamp: string;
  total: number;
  critical: number;
  warning: number;
  results: TickerResult[];
}

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [searchTicker, setSearchTicker] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const searchSingle = async () => {
    if (!searchTicker) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analyze?ticker=${searchTicker}`);
      const json = await res.json();
      setData({
        timestamp: json.timestamp,
        total: 1,
        critical: json.level === 'CRITICAL' ? 1 : 0,
        warning: json.level === 'WARNING' ? 1 : 0,
        results: [json]
      });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-600';
      case 'WARNING': return 'bg-orange-500';
      case 'ATTENTION': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          🏢 CORPORATE DECAY
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          Early Warning System - Detects bankruptcies 30-90 days before
        </p>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <input
          type="text"
          placeholder="Search ticker..."
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && searchSingle()}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1rem',
            width: '200px',
            background: '#2a2a4e',
            color: '#fff'
          }}
        />
        <button
          onClick={searchSingle}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#4a4aff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Search
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: loading ? '#555' : '#6a6aff',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh All'}
        </button>
      </div>

      {/* Stats */}
      {data && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <StatCard label="Total Monitored" value={data.total} color="#4a4aff" />
          <StatCard label="Critical 🔴" value={data.critical} color="#ef4444" />
          <StatCard label="Warning 🟠" value={data.warning} color="#f97316" />
          <StatCard label="Last Update" value={lastUpdate} color="#22c55e" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#7f1d1d',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ❌ Error: {error}
        </div>
      )}

      {/* Results Table */}
      {data && data.results && (
        <div style={{
          background: '#1e1e3f',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#2a2a5a' }}>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Level</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>1M Chg</th>
                <th style={thStyle}>3M Chg</th>
                <th style={thStyle}>From High</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r, i) => (
                <tr key={r.ticker} style={{
                  background: i % 2 === 0 ? '#1a1a3a' : '#1e1e4a',
                  borderBottom: '1px solid #333'
                }}>
                  <td style={tdStyle}>
                    <strong>{r.emoji} {r.ticker}</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: getScoreColor(r.score),
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold'
                    }}>
                      {r.score}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span className={getLevelColor(r.level)} style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {r.level}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {r.price ? `$${r.price.current.toFixed(2)}` : '-'}
                  </td>
                  <td style={{...tdStyle, color: r.price && r.price.change1M < 0 ? '#ef4444' : '#22c55e'}}>
                    {r.price ? `${r.price.change1M.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{...tdStyle, color: r.price && r.price.change3M < 0 ? '#ef4444' : '#22c55e'}}>
                    {r.price ? `${r.price.change3M.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{...tdStyle, color: '#ef4444'}}>
                    {r.price ? `${r.price.pctFromHigh.toFixed(1)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
        <p>Hecho por duendes.app 2026</p>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '15px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#aaa'
};

const tdStyle: React.CSSProperties = {
  padding: '12px 15px'
};

function getScoreColor(score: number): string {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#22c55e';
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: '#1e1e3f',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: '#888', fontSize: '0.9rem' }}>{label}</div>
    </div>
  );
}
