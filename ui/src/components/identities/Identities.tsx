import { useStore } from '@/store/useStore';
import { IdentityCreator } from './IdentityCreator';
import { IdentityList } from './IdentityList';

export function Identities() {
  const { identities, refreshIdentities } = useStore();

  return (
    <div className="space-y-6">
      <IdentityCreator onCreated={refreshIdentities} />
      <IdentityList
        identities={identities}
        onDelete={refreshIdentities}
        onUpdate={refreshIdentities}
      />
    </div>
  );
}
