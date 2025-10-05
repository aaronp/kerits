interface ACDCRowProps {
  contactPrefix: string;
  registryAID: string;
}

export function ACDCRow({ contactPrefix, registryAID }: ACDCRowProps) {
  return (
    <div className="text-sm text-muted-foreground p-2 border-l-2 border-muted">
      ACDCRow component for contact: {contactPrefix} in registry: {registryAID}
      {/* TODO: Implement ACDC credential display */}
    </div>
  );
}
