import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Combobox } from '../ui/combobox';
import type { ComboboxOption } from '../ui/combobox';
import { CreateTELModal } from './CreateTELModal';
import { useUser } from '@/lib/user-provider';
import { getDSL } from '@/lib/dsl';
import { useStore } from '@/store/useStore';

interface TELRegistry {
  alias: string;
  registryId: string;
  issuerAid: string;
}

interface TELSelectorProps {
  value: string; // Selected registry AID
  onChange: (registryAID: string, alias?: string) => void;
  className?: string;
}

export function TELSelector({ value, onChange, className }: TELSelectorProps) {
  const [registries, setRegistries] = useState<TELRegistry[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();
  const { identities } = useStore();

  // Load registries
  const loadRegistries = async () => {
    if (!currentUser) {
      setRegistries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const dsl = await getDSL(currentUser.id);
      const accountNames = await dsl.accountNames();

      const allRegistries: TELRegistry[] = [];

      // Iterate through all accounts and their registries
      for (const accountAlias of accountNames) {
        const accountDsl = await dsl.account(accountAlias);
        if (!accountDsl) continue;

        const registryAliases = await accountDsl.listRegistries();

        for (const registryAlias of registryAliases) {
          const registryDsl = await accountDsl.registry(registryAlias);
          if (!registryDsl) continue;

          allRegistries.push({
            alias: registryAlias,
            registryId: registryDsl.registry.registryId,
            issuerAid: accountDsl.account.aid,
          });
        }
      }

      setRegistries(allRegistries);
    } catch (error) {
      console.error('Failed to load TEL registries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistries();
  }, []);

  // Convert registries to combobox options
  const options: ComboboxOption[] = [
    // Add "Create New" option at the top
    {
      value: '__CREATE_NEW__',
      label: '+ Create New Registry',
      description: 'Create a new credential registry',
    },
    // Add existing registries
    ...registries.map((registry) => ({
      value: registry.registryId,
      label: registry.alias,
      description: registry.registryId.substring(0, 40) + '...',
    })),
  ];

  const handleChange = (selectedValue: string) => {
    if (selectedValue === '__CREATE_NEW__') {
      setShowCreateModal(true);
    } else {
      // Find the registry to get its alias
      const registry = registries.find((r) => r.registryId === selectedValue);
      onChange(selectedValue, registry?.alias);
    }
  };

  const handleCreated = (registryAlias: string) => {
    // Reload registries
    loadRegistries();
    // Auto-select the new registry - find it by alias
    const registry = registries.find((r) => r.alias === registryAlias);
    if (registry) {
      onChange(registry.registryId, registry.alias);
    }
  };

  // Get display value
  const getDisplayValue = () => {
    if (value === '__CREATE_NEW__') return '';

    const registry = registries.find((r) => r.registryId === value);
    if (registry) {
      return registry.alias;
    }
    return value;
  };

  return (
    <>
      <Combobox
        options={options}
        value={value}
        onChange={handleChange}
        placeholder={loading ? 'Loading registries...' : 'Select registry or create new...'}
        emptyMessage="No registries found. Create a new one."
        allowCustomValue={false}
        className={className}
      />
      <CreateTELModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
