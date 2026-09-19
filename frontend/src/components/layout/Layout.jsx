import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F6F7F9' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
