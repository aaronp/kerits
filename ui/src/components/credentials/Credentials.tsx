import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { CredentialList } from './CredentialList';
import { VerifyCredential } from './VerifyCredential';
import { Plus, Shield } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { route } from '@/config';

export function Credentials() {
  const navigate = useNavigate();
  const { credentials, refreshCredentials } = useStore();
  const [view, setView] = useState<'list' | 'verify'>('list');

  useEffect(() => {
    refreshCredentials();
  }, [refreshCredentials]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Credentials</h2>
          <p className="text-sm text-muted-foreground">
            Issue, manage, and verify credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'verify' ? 'default' : 'outline'}
            onClick={() => setView('verify')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Verify
          </Button>
          <Button
            onClick={() => navigate(route('/dashboard/credentials/new'))}
            className="border shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="mr-2 h-4 w-4" />
            Issue Credential
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <CredentialList
          credentials={credentials}
          onDelete={refreshCredentials}
          onImport={refreshCredentials}
        />
      ) : (
        <VerifyCredential />
      )}
    </div>
  );
}
