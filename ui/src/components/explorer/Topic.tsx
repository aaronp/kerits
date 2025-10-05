interface TopicProps {
  registryAID: string;
}

export function Topic({ registryAID }: TopicProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Topics</h3>
      <div className="text-sm text-muted-foreground">
        Topic component for registry: {registryAID}
      </div>
      {/* TODO: Implement topic list and functionality */}
    </div>
  );
}
