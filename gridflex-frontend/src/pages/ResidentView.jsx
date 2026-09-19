import React from 'react';
import { ShieldCheck, CheckCircle2, BatteryCharging, Home, Bell, Info } from 'lucide-react';
import { useGridState } from '../context/GridStateContext';

export function ResidentView() {
  const { isCloudEvent } = useGridState();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px', paddingBottom: '40px' }}>
      
      {/* Resident Experience Mobile-style Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Mobile Header Bar */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600, letterSpacing: '0.04em' }}>
              DHARAVI NORTH ENERGY NETWORK
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
              Good evening, Kavita
            </h2>
          </div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Home size={18} color="#38BDF8" />
          </div>
        </div>

        {/* Main Status Reassurance Banner */}
        <div style={{ padding: '24px' }}>
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: '#D1FAE5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <ShieldCheck size={28} />
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              STATUS CONFIRMED
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>
              YOUR ELECTRICITY IS STABLE
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#047857', marginTop: '6px', lineHeight: 1.4 }}>
              Your home electricity supply is continuous and protected by Dharavi's smart community power reserves.
            </p>
          </div>

          {/* Key Resident Bullet Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              <span>Essential electricity fully protected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              <span>Community battery storage active and ready</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              <span>Grid conditions actively managed by operators</span>
            </div>
          </div>

          {/* Community Energy Health Bar */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569' }}>
                COMMUNITY ENERGY STATUS
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                {isCloudEvent ? 'SUPPORT ACTIVE' : 'OPTIMAL'}
              </span>
            </div>

            {/* Custom Bar */}
            <div style={{ height: '10px', backgroundColor: '#E2E8F0', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: isCloudEvent ? '78%' : '92%', backgroundColor: '#059669', borderRadius: '5px', transition: 'width 300ms ease' }} />
            </div>

            <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '8px', textAlign: 'center' }}>
              {isCloudEvent
                ? 'Solar drop detected nearby — Battery reserves are supplying local homes.'
                : 'Local solar panels and grid supply are operating normally.'}
            </div>
          </div>

          {/* Helpful Resident Advisory Note */}
          <div style={{
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Bell size={18} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369A1' }}>
                Community Eco-Shift Notice
              </div>
              <p style={{ fontSize: '0.775rem', color: '#0C4A6E', marginTop: '2px', lineHeight: 1.4 }}>
                You may receive a polite request to shift non-essential usage (like heavy water heating) by 1-2 hours to support neighbourhood stability.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#F8FAFC', padding: '12px 24px', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.725rem', color: '#94A3B8' }}>
          GridFlex AI · Resident Service Portal · Household #24-D
        </div>
      </div>
    </div>
  );
}
