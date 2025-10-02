import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { CredentialList } from './CredentialList';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function Credentials() {
  const navigate = useNavigate();
  const { credentials, refreshCredentials } = useStore();

  useEffect(() => {
    refreshCredentials();
  }, [refreshCredentials]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Credentials</h2>
          <p className="text-sm text-muted-foreground">
            Issue and manage verifiable credentials
          </p>
        </div>
        <Button onClick={() => navigate('/credentials/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Issue Credential
        </Button>
      </div>

      <CredentialList
        credentials={credentials}
        onDelete={refreshCredentials}
        onImport={refreshCredentials}
      />
    </div>
  );
}
