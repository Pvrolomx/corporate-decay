// Corporate Decay - Scoring System
// Score 0-100 based on multiple signals

import { PriceData } from './fetchers';

export interface SignalScores {
  D1_Price1M: number;      // 1 month price change
  D2_Price3M: number;      // 3 month price change
  D3_FromHigh: number;     // Distance from 52W high
  D4_ShortInterest: number; // Short interest %
  D5_Volume: number;       // Volume anomaly
  D6_Volatility: number;   // Implied volatility
}

export interface ScoringResult {
  signals: SignalScores;
  totalScore: number;
  level: 'NORMAL' | 'ATTENTION' | 'WARNING' | 'CRITICAL';
  emoji: string;
}

// Weights for each signal
const WEIGHTS = {
  D1_Price1M: 15,
  D2_Price3M: 20,
  D3_FromHigh: 20,
  D4_ShortInterest: 15,
  D5_Volume: 15,
  D6_Volatility: 15
};

// Score D1: 1 Month Price Change
function scorePrice1M(change: number): number {
  if (change <= -40) return 15;
  if (change <= -25) return 12;
  if (change <= -15) return 8;
  if (change <= -10) return 4;
  return 0;
}

// Score D2: 3 Month Price Change
function scorePrice3M(change: number): number {
  if (change <= -60) return 20;
  if (change <= -40) return 16;
  if (change <= -25) return 10;
  if (change <= -15) return 5;
  return 0;
}

// Score D3: Distance from 52W High
function scoreFromHigh(pct: number): number {
  if (pct <= -80) return 20;
  if (pct <= -60) return 15;
  if (pct <= -40) return 10;
  if (pct <= -25) return 5;
  return 0;
}

// Score D4: Short Interest
function scoreShortInterest(pct: number | null): number {
  if (pct === null) return 0;
  if (pct >= 30) return 15;
  if (pct >= 20) return 12;
  if (pct >= 15) return 8;
  if (pct >= 10) return 4;
  return 0;
}

// Score D5: Volume Anomaly
function scoreVolume(ratio: number, priceChange: number): number {
  // High volume matters more when price is falling
  if (priceChange >= 0) return 0;
  
  if (ratio >= 5) return 15;
  if (ratio >= 3) return 10;
  if (ratio >= 2) return 5;
  return 0;
}

// Score D6: Volatility
function scoreVolatility(vol: number): number {
  if (vol >= 150) return 15;
  if (vol >= 100) return 10;
  if (vol >= 80) return 6;
  if (vol >= 60) return 3;
  return 0;
}

// Get level from score
function getLevel(score: number): { level: ScoringResult['level']; emoji: string } {
  if (score >= 75) return { level: 'CRITICAL', emoji: '🔴' };
  if (score >= 50) return { level: 'WARNING', emoji: '🟠' };
  if (score >= 25) return { level: 'ATTENTION', emoji: '🟡' };
  return { level: 'NORMAL', emoji: '🟢' };
}

// Main scoring function
export function calculateScore(
  priceData: PriceData | null,
  shortInterest: number | null,
  volatility: number
): ScoringResult {
  const signals: SignalScores = {
    D1_Price1M: 0,
    D2_Price3M: 0,
    D3_FromHigh: 0,
    D4_ShortInterest: 0,
    D5_Volume: 0,
    D6_Volatility: 0
  };

  if (priceData) {
    signals.D1_Price1M = scorePrice1M(priceData.change1M);
    signals.D2_Price3M = scorePrice3M(priceData.change3M);
    signals.D3_FromHigh = scoreFromHigh(priceData.pctFromHigh);
    signals.D5_Volume = scoreVolume(priceData.volumeRatio, priceData.change1M);
  }

  signals.D4_ShortInterest = scoreShortInterest(shortInterest);
  signals.D6_Volatility = scoreVolatility(volatility);

  const totalScore = Object.values(signals).reduce((a, b) => a + b, 0);
  const { level, emoji } = getLevel(totalScore);

  return {
    signals,
    totalScore,
    level,
    emoji
  };
}

// Default watchlist
export const DEFAULT_WATCHLIST = [
  // Meme / Retail
  'GME', 'AMC', 'BBBY',
  // Tech Unprofitable
  'SNAP', 'LYFT', 'PTON', 'W', 'WISH', 'HOOD',
  // EV / SPACs
  'RIVN', 'LCID', 'NKLA', 'QS', 'GOEV',
  // Retail Distressed
  'M', 'KSS', 'GPS', 'BBY',
  // High Debt / Struggling
  'PARA', 'WBD', 'DISH',
  // Crypto Adjacent
  'COIN', 'MSTR', 'RIOT', 'MARA'
];
