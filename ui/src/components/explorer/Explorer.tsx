import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getTELRegistriesByIssuer } from '@/lib/storage';
import type { TELRegistry } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import { Topic } from './Topic';

export function Explorer() {
  const { identities } = useStore();
  const [registries, setRegistries] = useState<TELRegistry[]>([]);
  const [expandedRegistries, setExpandedRegistries] = useState<Set<string>>(new Set());

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
    // TODO: Open dialog to create new registry
    console.log('Add new registry');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credential Registries</CardTitle>
          <Button onClick={handleAddRegistry} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Registry
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
                <div key={registry.registryAID} className="border rounded-lg">
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
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
                      <div className="font-medium">{registry.alias}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {registry.registryAID}
                      </div>
                    </div>
                  </div>

                  {expandedRegistries.has(registry.registryAID) && (
                    <div className="border-t p-4 bg-muted/30">
                      <Topic registryAID={registry.registryAID} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
