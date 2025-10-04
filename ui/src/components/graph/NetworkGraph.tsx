import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import { IdentityEventGraph } from './IdentityEventGraph';

export function NetworkGraph() {
  const { said: saidParam } = useParams<{ said?: string }>();
  const { identities, credentials, telRefreshTrigger } = useStore();
  const { currentUser, users } = useUser();

  // Determine which SAID to display - prefer current user's identity
  const currentUserIdentity = identities.find(i =>
    i.alias.toLowerCase() === users.find(u => u.id === currentUser?.id)?.name.toLowerCase()
  );
  const displaySAID = saidParam || currentUserIdentity?.prefix || (identities.length > 0 ? identities[0].prefix : '');
  const identity = identities.find(i => i.prefix === displaySAID);

  if (!identity || !displaySAID) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No identity found - create an identity to view the network graph
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <IdentityEventGraph
      alias={identity.alias}
      prefix={identity.prefix}
      inceptionEvent={identity.inceptionEvent}
      kelEvents={identity.kel}
      showTEL={true}
      credentials={credentials}
      telRefreshTrigger={telRefreshTrigger}
    />
  );
}
