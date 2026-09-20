/**
 * GridFlex Reliability Copilot Panel
 *
 * Renders the AI-powered Q&A interface powered by Amazon Bedrock.
 * Connects to POST /api/v1/copilot/query and GET /api/v1/copilot/status.
 *
 * UI clearly distinguishes:
 *   - AI response (from Bedrock)        → labelled "AI RESPONSE"
 *   - Deterministic fallback             → labelled "DETERMINISTIC DATA"
 *   - Simulation result                  → labelled "SIMULATION"
 *   - Live vs fallback mode
 */
import React, { useState, useEffect, useRef } from 'react';
import { Send, Cpu, AlertTriangle, Clock, Database, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { CONFIG } from '../../config';
import { useBuildingContext } from '../../context/BuildingContext';
import { useGridState } from '../../context/GridStateContext';

const PRESET_QUESTIONS = [
  { label: 'Why is the grid under stress?', icon: '⚡' },
  { label: 'Why did the current reliability event trigger?', icon: '🔴' },
  { label: 'Where can we get another 30 kW of flexibility?', icon: '🔋' },
  { label: 'What happens if solar output falls another 20%?', icon: '☁️' },
  { label: 'Why did GridFlex choose these resources?', icon: '📊' },
  { label: 'Are any critical loads exposed?', icon: '🏥' },
];

async function queryBedrock(message, feederId, eventId) {
  const resp = await fetch(`${CONFIG.API_BASE_URL}/api/v1/copilot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, feeder_id: feederId, event_id: eventId || null }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

async function fetchStatus() {
  const resp = await fetch(`${CONFIG.API_BASE_URL}/api/v1/copilot/status`);
  if (!resp.ok) return null;
  return resp.json();
}

export function CopilotPanel({ feederId = 'F01', eventId = null }) {
  const { theme } = useBuildingContext();
  const { feederState, isCloudEvent, lastUpdated } = useGridState();
  const isLight = theme === 'light';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const inputRef = useRef(null);

  // Theme tokens
  const bg      = isLight ? '#FFFFFF' : '#111111';
  const bgDeep  = isLight ? '#F8FAFC' : '#0A0A0A';
  const bgInput = isLight ? '#FFFFFF' : '#1A1A1A';
  const border  = isLight ? '#E2E8DC' : '#1E1E1E';
  const borderM = isLight ? '#E2E8F0' : '#242424';
  const textPri = isLight ? '#0F172A' : '#F5F1E8';
  const textSec = isLight ? '#475569' : '#94A3B8';
  const textDim = '#64748B';

  // Fetch Bedrock status on mount
  useEffect(() => {
    fetchStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const submit = async (question) => {
    const q = question || input.trim();
    if (!q) return;
    setInput('');
    setLoading(true);
    setError(null);
    setResponse(null);
    setShowSources(false);
    try {
      const result = await queryBedrock(q, feederId, eventId);
      setResponse({ question: q, ...result });
    } catch (err) {
      setError(err.message || 'Copilot request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  // Indicator colours
  const bedrockEnabled  = status?.enabled;
  const credentialsOk   = status?.credentials_available;
  const isLive          = bedrockEnabled && credentialsOk;
  const modeColor       = isLive ? '#059669' : '#D97706';
  const modeLabel       = isLive ? 'LIVE — Bedrock AI' : 'FALLBACK — Deterministic';

  const responseMode    = response?.mode;
  const isAIResponse    = responseMode === 'live';
  const isSimulation    = response?.answer?.includes('SIMULATION') || response?.answer?.includes('⚠️');

  return (
    <div style={{
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '560px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${borderM}`,
        backgroundColor: bgDeep,
        borderRadius: '8px 8px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '6px',
              backgroundColor: isLight ? 'rgba(212,132,26,0.12)' : 'rgba(212,132,26,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={17} color="#D4841A" />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.95rem', color: textPri }}>
                GRIDFLEX RELIABILITY COPILOT
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: textDim, letterSpacing: '0.06em' }}>
                Powered by Amazon Bedrock
              </div>
            </div>
          </div>

          {/* Mode indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {eventId && (
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700,
                color: isLight ? '#0284C7' : '#38BDF8',
                backgroundColor: isLight ? '#F0F9FF' : 'rgba(56,189,248,0.1)',
                padding: '3px 8px', borderRadius: '3px',
                border: isLight ? '1px solid #BAE6FD' : '1px solid rgba(56,189,248,0.25)',
              }}>
                {eventId}
              </span>
            )}
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700,
              color: modeColor,
              backgroundColor: isLight
                ? (isLive ? 'rgba(5,150,105,0.08)' : 'rgba(217,119,6,0.08)')
                : (isLive ? 'rgba(5,150,105,0.12)' : 'rgba(217,119,6,0.12)'),
              padding: '3px 8px', borderRadius: '3px',
              border: `1px solid ${isLive ? 'rgba(5,150,105,0.3)' : 'rgba(217,119,6,0.3)'}`,
            }}>
              ● {modeLabel}
            </span>
          </div>
        </div>

        {/* Model info strip */}
        {status && (
          <div style={{
            marginTop: '8px', display: 'flex', gap: '16px',
            fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: textDim,
          }}>
            <span>MODEL: {status.model}</span>
            <span>REGION: {status.region}</span>
            {status.guardrail_configured && <span>GUARDRAIL: ✓</span>}
          </div>
        )}
      </div>

      {/* Response area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        {!response && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: textDim }}>
            <Cpu size={36} color={isLight ? '#CBD5E1' : '#334155'} style={{ marginBottom: '12px' }} />
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: textSec }}>
              Ask about live grid conditions
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: textDim }}>
              The Copilot reads live GridFlex data to answer your questions.
            </div>
            {isCloudEvent && (
              <div style={{ marginTop: '12px', padding: '8px 14px', backgroundColor: isLight ? '#FEF3C7' : 'rgba(217,119,6,0.1)', borderRadius: '4px', border: `1px solid ${isLight ? '#FDE68A' : 'rgba(217,119,6,0.3)'}` }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#D97706', fontWeight: 700 }}>
                  ● CLOUD EVENT ACTIVE — ask "Why did the event trigger?"
                </span>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div style={{
            padding: '20px', backgroundColor: isLight ? '#F8FAFC' : '#1A1A1A',
            borderRadius: '6px', border: `1px solid ${borderM}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div className="animate-pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4841A' }} />
              <span style={{ fontFamily: 'Cinzel', fontSize: '0.68rem', fontWeight: 700, color: '#D4841A', letterSpacing: '0.08em' }}>
                GRIDFLEX IS REASONING OVER LIVE GRID DATA
              </span>
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: textSec }}>
              Querying GridFlex services via Amazon Bedrock Converse API…
            </div>
            {[
              'Reading feeder state from GridIntelligenceService',
              'Fetching 48-slot demand + solar forecast',
              'Analysing flexibility pool and reliability events',
            ].map((step, i) => (
              <div key={i} style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: textDim }}>
                <span style={{ color: '#D4841A' }}>→</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px', backgroundColor: isLight ? '#FEF2F2' : 'rgba(220,38,38,0.08)',
            borderRadius: '6px', border: isLight ? '1px solid #FCA5A5' : '1px solid rgba(220,38,38,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertTriangle size={16} color="#DC2626" />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 700, color: '#DC2626' }}>
                COPILOT UNAVAILABLE
              </span>
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.82rem', color: isLight ? '#991B1B' : '#FCA5A5', marginBottom: '8px' }}>
              {error}
            </div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: textDim }}>
              Bedrock is unavailable. All deterministic GridFlex services remain fully operational.
            </div>
          </div>
        )}

        {response && !loading && (
          <div>
            {/* Question */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: textDim, marginBottom: '4px', letterSpacing: '0.05em' }}>
                YOU ASKED:
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.88rem', color: textSec, fontStyle: 'italic' }}>
                "{response.question}"
              </div>
            </div>

            {/* Response badge */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {isAIResponse ? (
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: '3px', backgroundColor: isLight ? 'rgba(212,132,26,0.1)' : 'rgba(212,132,26,0.15)', color: '#D4841A', border: '1px solid rgba(212,132,26,0.3)' }}>
                  ✦ AI RESPONSE — Amazon Bedrock
                </span>
              ) : (
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: '3px', backgroundColor: isLight ? '#F1F5F9' : '#1A1A1A', color: textDim, border: `1px solid ${borderM}` }}>
                  DETERMINISTIC DATA
                </span>
              )}
              {isSimulation && (
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: '3px', backgroundColor: isLight ? '#DBEAFE' : 'rgba(37,99,235,0.12)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.3)' }}>
                  SIMULATION
                </span>
              )}
            </div>

            {/* Answer text */}
            <div style={{
              fontFamily: 'DM Sans', fontSize: '0.875rem', color: textPri, lineHeight: 1.65,
              padding: '14px 16px', backgroundColor: isLight ? '#F8FAFC' : '#161616',
              borderRadius: '6px', border: `1px solid ${borderM}`,
              marginBottom: '12px', whiteSpace: 'pre-wrap',
            }}>
              {response.answer}
            </div>

            {/* Tools used */}
            {response.tools_used && response.tools_used.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSources(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: textDim, fontFamily: 'JetBrains Mono', fontSize: '0.65rem', padding: 0, marginBottom: '6px' }}
                >
                  {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  TOOLS USED ({response.tools_used.length})
                </button>
                {showSources && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {response.tools_used.map((t, i) => (
                      <span key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', padding: '2px 7px', borderRadius: '3px', backgroundColor: isLight ? '#F0F9FF' : 'rgba(2,132,199,0.1)', color: isLight ? '#0369A1' : '#38BDF8', border: isLight ? '1px solid #BAE6FD' : '1px solid rgba(56,189,248,0.25)' }}>
                        {typeof t === 'string' ? t : t.tool_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sources + timestamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: textDim, fontFamily: 'JetBrains Mono' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {response.sources && response.sources.map((s, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Database size={10} /> {s}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Clock size={10} />
                {response.data_timestamp
                  ? new Date(response.data_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '--:--:--'}
              </div>
            </div>

            {response.latency_ms && (
              <div style={{ marginTop: '4px', fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: textDim }}>
                Latency: {response.latency_ms} ms · Model: {response.model}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preset questions */}
      <div style={{ padding: '10px 18px', borderTop: `1px solid ${borderM}`, backgroundColor: bgDeep }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: textDim, marginBottom: '8px', letterSpacing: '0.06em' }}>
          QUICK QUESTIONS:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESET_QUESTIONS.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => submit(label)}
              disabled={loading}
              title={label}
              style={{
                fontFamily: 'DM Sans', fontSize: '0.72rem', fontWeight: 500,
                padding: '4px 10px', borderRadius: '4px',
                backgroundColor: loading ? (isLight ? '#F0F4EC' : '#1A1A1A') : (isLight ? '#EAEFE3' : '#1A1A1A'),
                border: `1px solid ${isLight ? '#DAE2D2' : '#2A2A2A'}`,
                color: loading ? textDim : textSec,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {icon} {label.split(' ').slice(0, 4).join(' ')}…
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${borderM}`, display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask GridFlex anything about the live grid…"
          disabled={loading}
          style={{
            flex: 1,
            padding: '9px 14px',
            backgroundColor: bgInput,
            border: `1px solid ${isLight ? '#DAE2D2' : '#2A2A2A'}`,
            borderRadius: '4px',
            color: textPri,
            fontFamily: 'DM Sans', fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <button
          onClick={() => submit()}
          disabled={loading || !input.trim()}
          title="Send question to GridFlex Copilot"
          style={{
            width: '38px', height: '38px', borderRadius: '4px',
            backgroundColor: (loading || !input.trim())
              ? (isLight ? '#EAEFE3' : '#1A1A1A')
              : '#D4841A',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: (loading || !input.trim()) ? textDim : '#0F0F0F',
            cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {loading ? <RefreshCw size={16} className="animate-spin-slow" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
