interface ActiveDCAsProps {
  address: string;
}

export function ActiveDCAs(_props: ActiveDCAsProps) {
  return (
    <div className="no-dcas">
      No active DCAs found for this address
    </div>
  );
} 