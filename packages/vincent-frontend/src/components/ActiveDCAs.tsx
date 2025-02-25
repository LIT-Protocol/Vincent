import React from 'react';

interface ActiveDCAsProps {
  address: string;
}

export function ActiveDCAs({ address }: ActiveDCAsProps) {
  return (
    <div className="no-dcas">
      No active DCAs found for this address
    </div>
  );
} 