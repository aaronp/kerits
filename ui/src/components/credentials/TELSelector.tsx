import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Combobox } from '../ui/combobox';
import type { ComboboxOption } from '../ui/combobox';
import { getTELRegistries } from '@/lib/storage';
import type { TELRegistry } from '@/lib/storage';
import { CreateTELModal } from './CreateTELModal';

interface TELSelectorProps {
  value: string; // Selected registry AID
  onChange: (registryAID: string, alias?: string) => void;
  className?: string;
}

export function TELSelector({ value, onChange, className }: TELSelectorProps) {
  const [registries, setRegistries] = useState<TELRegistry[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load registries
  const loadRegistries = async () => {
    setLoading(true);
    try {
      const loaded = await getTELRegistries();
      setRegistries(loaded);
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
      value: registry.registryAID,
      label: registry.alias,
      description: registry.registryAID.substring(0, 40) + '...',
    })),
  ];

  const handleChange = (selectedValue: string) => {
    if (selectedValue === '__CREATE_NEW__') {
      setShowCreateModal(true);
    } else {
      // Find the registry to get its alias
      const registry = registries.find((r) => r.registryAID === selectedValue);
      onChange(selectedValue, registry?.alias);
    }
  };

  const handleCreated = (newRegistry: TELRegistry) => {
    // Reload registries
    loadRegistries();
    // Auto-select the new registry
    onChange(newRegistry.registryAID, newRegistry.alias);
  };

  // Get display value
  const getDisplayValue = () => {
    if (value === '__CREATE_NEW__') return '';

    const registry = registries.find((r) => r.registryAID === value);
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
