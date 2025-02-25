interface ActiveDCAsProps {
  address: string;
}

export function ActiveDCAs({ address }: ActiveDCAsProps) {
  return (
    <div className="no-dcas">
      No active DCAs found for address: {address.slice(0, 6)}...{address.slice(-4)}
    </div>
  );
} 