import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Toast, useToast } from '../ui/toast';
import { getTELRegistriesByIssuer, saveTELRegistry } from '@/lib/storage';
import type { TELRegistry } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/lib/theme-provider';
import { Topic } from './Topic';
import { registryIncept } from '@/../../src/tel';

export function Explorer() {
  const { identities } = useStore();
  const { theme } = useTheme();
  const [registries, setRegistries] = useState<TELRegistry[]>([]);
  const [expandedRegistries, setExpandedRegistries] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRegistryName, setNewRegistryName] = useState('');
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const loadRegistries = async () => {
      if (identities.length === 0) return;

      const allRegistries: TELRegistry[] = [];
      for (const identity of identities) {
        const regs = await getTELRegistriesByIssuer(identity.prefix);
        allRegistries.push(...regs);
      }
      setRegistries(allRegistries);
    };

    loadRegistries();
  }, [identities]);

  const toggleRegistry = (registryAID: string) => {
    setExpandedRegistries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(registryAID)) {
        newSet.delete(registryAID);
      } else {
        newSet.add(registryAID);
      }
      return newSet;
    });
  };

  const handleAddRegistry = () => {
    setNewRegistryName('');
    setShowAddDialog(true);
  };

  const handleCreateRegistry = async () => {
    if (!newRegistryName.trim()) {
      showToast('Please enter a name for the registry');
      return;
    }

    if (identities.length === 0) {
      showToast('No identity found. Please create an identity first.');
      return;
    }

    try {
      // Use the first identity as the issuer
      const issuerIdentity = identities[0];

      // Create registry inception event
      const inception = registryIncept({
        issuer: issuerIdentity.prefix,
        nonce: '',
      });

      // Create TEL registry object
      const newRegistry: TELRegistry = {
        id: inception.sad.i,
        registryAID: inception.sad.i,
        alias: newRegistryName.trim(),
        issuerAID: issuerIdentity.prefix,
        inceptionEvent: inception,
        tel: [],
        createdAt: new Date().toISOString(),
      };

      // Save registry (this also saves the alias automatically)
      await saveTELRegistry(newRegistry);

      // Reload registries
      const updatedRegistries = await getTELRegistriesByIssuer(issuerIdentity.prefix);
      setRegistries(updatedRegistries);

      setShowAddDialog(false);
      setNewRegistryName('');
      showToast('Registry created');
    } catch (error) {
      console.error('Failed to create registry:', error);
      showToast('Failed to create registry');
    }
  };

  return (
    <div className="space-y-6 -m-6 p-6 min-h-full" style={{ backgroundColor: theme === 'dark' ? 'rgb(2 6 23)' : 'rgb(248 250 252)' }}>
      <Card style={{ backgroundColor: theme === 'dark' ? 'rgb(15 23 42)' : 'rgb(255 255 255)' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credential Registries</CardTitle>
          <Button onClick={handleAddRegistry} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {registries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No credential registries found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {registries.map((registry) => (
                <div key={registry.registryAID} className="border rounded-lg" style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}>
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer transition-colors"
                    style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgb(51 65 85)' : 'rgb(226 232 240)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)'}
                    onClick={() => toggleRegistry(registry.registryAID)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRegistry(registry.registryAID);
                      }}
                    >
                      {expandedRegistries.has(registry.registryAID) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="font-medium" title={registry.registryAID}>
                        {registry.alias}
                      </div>
                    </div>
                  </div>

                  {expandedRegistries.has(registry.registryAID) && (
                    <div className="border-t p-4">
                      <Topic registryAID={registry.registryAID} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Registry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Registry</DialogTitle>
            <DialogDescription>
              Enter a name for your new credential registry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="registry-name">Registry Name</Label>
              <Input
                id="registry-name"
                placeholder="e.g., My Credentials"
                value={newRegistryName}
                onChange={(e) => setNewRegistryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRegistry();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRegistry}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
