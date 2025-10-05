import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { useStore } from '@/store/useStore';
import { useUser } from '@/lib/user-provider';
import { IdentityEventGraph } from './IdentityEventGraph';
import { getKEL } from '@/lib/storage';
import type { KEL } from '@/lib/storage';

export function NetworkGraph() {
  const { said: saidParam } = useParams<{ said?: string }>();
  const { identities, credentials, telRefreshTrigger } = useStore();
  const { currentUser, users } = useUser();
  const [kel, setKel] = useState<KEL | null>(null);

  // Determine which SAID to display - prefer current user's identity
  const currentUserIdentity = identities.find(i =>
    i.alias.toLowerCase() === users.find(u => u.id === currentUser?.id)?.name.toLowerCase()
  );
  const displaySAID = saidParam || currentUserIdentity?.prefix || (identities.length > 0 ? identities[0].prefix : '');
  const identity = identities.find(i => i.prefix === displaySAID);

  // Load full KEL from storage
  useEffect(() => {
    if (!displaySAID) return;

    const loadKEL = async () => {
      try {
        const loadedKEL = await getKEL(displaySAID);
        setKel(loadedKEL || null);
      } catch (error) {
        console.error('Failed to load KEL:', error);
      }
    };

    loadKEL();
  }, [displaySAID, telRefreshTrigger]);

  if (!identity || !displaySAID || !kel) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            {!identity || !displaySAID
              ? 'No identity found - create an identity to view the network graph'
              : 'Loading KEL...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <IdentityEventGraph
      alias={identity.alias}
      prefix={identity.prefix}
      inceptionEvent={kel.inceptionEvent}
      kelEvents={kel.events}
      showTEL={true}
      credentials={credentials}
      telRefreshTrigger={telRefreshTrigger}
    />
  );
}
