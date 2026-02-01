// Corporate Decay - Daily Cron Job
// Runs at 7am CST (13:00 UTC) via Vercel Cron

import { NextRequest, NextResponse } from 'next/server';
import { fetchPriceData, fetchShortData } from '../../../lib/fetchers';
import { calculateScore, DEFAULT_WATCHLIST } from '../../../lib/scoring';
import { sendAlert, sendDailySummary } from '../../../lib/alerts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds

export async function GET(req: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = req.headers.get('authorization');
  
  console.log('🔄 Corporate Decay Cron Job Started');
  
  const results = [];
  const alertsSent = [];
  
  for (const ticker of DEFAULT_WATCHLIST) {
    try {
      const priceData = await fetchPriceData(ticker);
      const shortInterest = await fetchShortData(ticker);
      const volatility = priceData ? Math.abs(priceData.change1M) * 3 : 50;
      
      const scoring = calculateScore(priceData, shortInterest, volatility);
      
      const result = {
        ticker,
        score: scoring.totalScore,
        level: scoring.level,
        emoji: scoring.emoji,
        signals: scoring.signals,
        priceData: priceData ? {
          current: priceData.current,
          change1M: priceData.change1M,
          change3M: priceData.change3M,
          pctFromHigh: priceData.pctFromHigh
        } : undefined
      };
      
      results.push(result);
      
      // Send individual alert for CRITICAL or WARNING
      if (scoring.level === 'CRITICAL' || scoring.level === 'WARNING') {
        const sent = await sendAlert(result);
        if (sent) alertsSent.push(ticker);
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 300));
      
    } catch (e) {
      console.error(`Error with ${ticker}:`, e);
    }
  }
  
  // Send daily summary
  await sendDailySummary(results);
  
  console.log(`✅ Cron completed: ${results.length} analyzed, ${alertsSent.length} alerts sent`);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    analyzed: results.length,
    alertsSent: alertsSent.length,
    critical: results.filter(r => r.level === 'CRITICAL').map(r => r.ticker),
    warning: results.filter(r => r.level === 'WARNING').map(r => r.ticker)
  });
}
