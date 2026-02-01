// Corporate Decay - Analyze Endpoint
// GET /api/analyze?ticker=GME or GET /api/analyze (all watchlist)

import { NextRequest, NextResponse } from 'next/server';
import { fetchPriceData, fetchShortData, calculateVolatility } from '../../../lib/fetchers';
import { calculateScore, DEFAULT_WATCHLIST } from '../../../lib/scoring';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  
  try {
    if (ticker) {
      // Analyze single ticker
      const result = await analyzeTicker(ticker.toUpperCase());
      return NextResponse.json(result, { headers: corsHeaders });
    } else {
      // Analyze all watchlist
      const results = await analyzeWatchlist();
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        total: results.length,
        critical: results.filter(r => r.level === 'CRITICAL').length,
        warning: results.filter(r => r.level === 'WARNING').length,
        results: results.sort((a, b) => b.score - a.score)
      }, { headers: corsHeaders });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Analysis failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function analyzeTicker(ticker: string) {
  const priceData = await fetchPriceData(ticker);
  const shortInterest = await fetchShortData(ticker);
  
  // For volatility, we'd need historical prices - using placeholder
  const volatility = priceData ? Math.abs(priceData.change1M) * 3 : 50;
  
  const scoring = calculateScore(priceData, shortInterest, volatility);
  
  return {
    ticker,
    timestamp: new Date().toISOString(),
    price: priceData ? {
      current: priceData.current,
      change1M: priceData.change1M,
      change3M: priceData.change3M,
      pctFromHigh: priceData.pctFromHigh,
      volumeRatio: priceData.volumeRatio
    } : null,
    shortInterest,
    volatility,
    signals: scoring.signals,
    score: scoring.totalScore,
    level: scoring.level,
    emoji: scoring.emoji
  };
}

async function analyzeWatchlist() {
  const results = [];
  
  for (const ticker of DEFAULT_WATCHLIST) {
    try {
      const result = await analyzeTicker(ticker);
      results.push(result);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`Error analyzing ${ticker}:`, e);
    }
  }
  
  return results;
}
