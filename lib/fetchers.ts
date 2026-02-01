// Corporate Decay - Data Fetchers
// Uses free APIs: Yahoo Finance, Google Trends (via SerpAPI alternative)

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export interface PriceData {
  current: number;
  change1M: number;
  change3M: number;
  high52W: number;
  pctFromHigh: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
}

export interface TickerAnalysis {
  ticker: string;
  price: PriceData | null;
  signals: Record<string, number>;
  score: number;
  level: string;
  timestamp: string;
}

// Fetch price data from Yahoo Finance
export async function fetchPriceData(ticker: string): Promise<PriceData | null> {
  try {
    // Get 3 months of daily data
    const url = `${YAHOO_BASE}/${ticker}?interval=1d&range=3mo`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const prices = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
    const meta = result.meta;
    
    if (prices.length < 22) return null;
    
    const current = prices[prices.length - 1];
    const price1M = prices[prices.length - 23] || prices[0];
    const price3M = prices[0];
    const high52W = meta.fiftyTwoWeekHigh || Math.max(...prices);
    
    // Calculate metrics
    const change1M = ((current - price1M) / price1M) * 100;
    const change3M = ((current - price3M) / price3M) * 100;
    const pctFromHigh = ((current - high52W) / high52W) * 100;
    
    const volume = volumes[volumes.length - 1] || 0;
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + (b || 0), 0) / 20;
    const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;
    
    return {
      current,
      change1M,
      change3M,
      high52W,
      pctFromHigh,
      volume,
      avgVolume,
      volumeRatio
    };
  } catch (e) {
    console.error(`Error fetching ${ticker}:`, e);
    return null;
  }
}

// Fetch short interest (approximation via Yahoo)
export async function fetchShortData(ticker: string): Promise<number | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const stats = data.quoteSummary?.result?.[0]?.defaultKeyStatistics;
    const shortPct = stats?.shortPercentOfFloat?.raw;
    
    return shortPct ? shortPct * 100 : null;
  } catch (e) {
    return null;
  }
}

// Calculate volatility from price history
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 20) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] && prices[i-1]) {
      returns.push(Math.log(prices[i] / prices[i-1]));
    }
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Annualize
  return stdDev * Math.sqrt(252) * 100;
}

// Fetch Google Trends spike (simplified - checks search interest)
export async function fetchGoogleSpike(query: string): Promise<number> {
  // Note: Google Trends doesn't have a free API
  // For MVP, we'll return 1.0 (baseline) and implement properly later
  // In production, use SerpAPI or pytrends via a Python endpoint
  return 1.0;
}
