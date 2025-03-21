'use client';

import React from 'react';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';
import './page.css';  // Importing the global CSS file
import SessionValidator from '../../components/consent/components/SessionValidator';
// Create Stytch client only on the client side
let stytchClient: any = null;
if (typeof window !== 'undefined') {
  try {
    const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
    if (publicToken) {
      stytchClient = createStytchUIClient(publicToken);
    }
  } catch (error) {
    console.error('Error initializing Stytch client:', error);
  }
}

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is completely separate from the root layout
  return (
    <html lang="en">
      <head>
        <title>Consent Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="consent-body">
        {stytchClient ? (
          <StytchProvider stytch={stytchClient}>
            <div className="consent-container">
              {children}
              <SessionValidator />
            </div>
          </StytchProvider>
        ) : (
          <div className="consent-container">
            {children}
          </div>
        )}
      </body>
    </html>
  );
} 