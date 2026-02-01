// Corporate Decay - Alert System
// Uses email.duendes.app for notifications

const EMAIL_SERVICE = 'https://email.duendes.app/api/send';
const RECIPIENT = 'pvrolomx@yahoo.com.mx';

interface AlertData {
  ticker: string;
  score: number;
  level: string;
  emoji: string;
  signals: Record<string, number>;
  priceData?: {
    current: number;
    change1M: number;
    change3M: number;
    pctFromHigh: number;
  };
}

export async function sendAlert(data: AlertData): Promise<boolean> {
  const signalsList = Object.entries(data.signals)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `• ${k}: ${v} pts`)
    .join('\n');

  const priceInfo = data.priceData 
    ? `\nPrecio actual: $${data.priceData.current.toFixed(2)}
Cambio 1M: ${data.priceData.change1M.toFixed(1)}%
Cambio 3M: ${data.priceData.change3M.toFixed(1)}%
Desde máximo 52W: ${data.priceData.pctFromHigh.toFixed(1)}%`
    : '';

  const message = `${data.emoji} CORPORATE DECAY ALERT

Ticker: ${data.ticker}
Score: ${data.score}/100
Nivel: ${data.level}
${priceInfo}

Señales activas:
${signalsList}

---
Acción sugerida: ${getRecommendation(data.level)}

---
Corporate Decay Monitor
https://corporate-decay.duendes.app`;

  try {
    const res = await fetch(EMAIL_SERVICE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: RECIPIENT,
        subject: `${data.emoji} CORPORATE DECAY: ${data.ticker} - ${data.level} (${data.score}/100)`,
        message,
        sendFrom: 'duendes.app',
        name: 'Corporate Decay Monitor'
      })
    });

    const result = await res.json();
    return result.success === true;
  } catch (e) {
    console.error('Error sending alert:', e);
    return false;
  }
}

export async function sendDailySummary(results: AlertData[]): Promise<boolean> {
  const critical = results.filter(r => r.level === 'CRITICAL');
  const warning = results.filter(r => r.level === 'WARNING');
  const attention = results.filter(r => r.level === 'ATTENTION');

  if (critical.length === 0 && warning.length === 0) {
    // No alert needed if nothing significant
    return true;
  }

  const formatTicker = (r: AlertData) => `${r.emoji} ${r.ticker}: ${r.score}/100`;

  const message = `📊 CORPORATE DECAY - RESUMEN DIARIO

🔴 CRÍTICOS (${critical.length}):
${critical.length > 0 ? critical.map(formatTicker).join('\n') : 'Ninguno'}

🟠 ALERTA (${warning.length}):
${warning.length > 0 ? warning.map(formatTicker).join('\n') : 'Ninguno'}

🟡 ATENCIÓN (${attention.length}):
${attention.length > 0 ? attention.map(formatTicker).join('\n') : 'Ninguno'}

---
Total monitoreados: ${results.length}
Timestamp: ${new Date().toISOString()}

Ver dashboard: https://corporate-decay.duendes.app`;

  try {
    const res = await fetch(EMAIL_SERVICE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: RECIPIENT,
        subject: `📊 Corporate Decay Daily: ${critical.length} críticos, ${warning.length} alertas`,
        message,
        sendFrom: 'duendes.app',
        name: 'Corporate Decay Monitor'
      })
    });

    const result = await res.json();
    return result.success === true;
  } catch (e) {
    console.error('Error sending summary:', e);
    return false;
  }
}

function getRecommendation(level: string): string {
  switch (level) {
    case 'CRITICAL':
      return '🚨 SALIR INMEDIATAMENTE de posiciones. Considerar puts.';
    case 'WARNING':
      return '⚠️ Revisar posiciones, preparar exit. Monitorear de cerca.';
    case 'ATTENTION':
      return '👀 Mantener en observación. Verificar tesis de inversión.';
    default:
      return 'Sin acción requerida.';
  }
}
