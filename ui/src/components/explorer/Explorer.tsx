import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, PlusCircle, Download, Upload, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Toast, useToast } from '../ui/toast';
import { getTELRegistriesByIssuer, saveTELRegistry, getKEL, appendKELEvent, getTEL, saveTEL, saveAlias } from '@/lib/storage';
import type { TELRegistry, TEL } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/lib/theme-provider';
import { CredentialRegistry } from './CredentialRegistry';
import { registryIncept, issue } from '@/../../src/tel';
import { interaction } from '@/../../src/interaction';
import { diger } from '@/../../src/diger';

export function Explorer() {
  const { identities } = useStore();
  const { theme } = useTheme();
  const [registries, setRegistries] = useState<TELRegistry[]>([]);
  const [expandedRegistries, setExpandedRegistries] = useState<Set<string>>(new Set());
  const [hoveredRegistry, setHoveredRegistry] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRegistryName, setNewRegistryName] = useState('');
  const [showAddACDCDialog, setShowAddACDCDialog] = useState(false);
  const [acdcAlias, setAcdcAlias] = useState('');
  const [selectedRegistryForACDC, setSelectedRegistryForACDC] = useState<string | null>(null);
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
    /**
     * Registry creation process (following KERI spec):
     * 1. Create TEL registry inception event (vcp) with issuer AID
     * 2. Create KEL interaction event (ixn) that anchors the vcp
     *    - The ixn includes a seal with the registry AID and vcp SAID
     *    - This proves the issuer claims ownership of the registry
     * 3. Append the ixn to the issuer's KEL
     * 4. Save the TEL registry
     */
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

      // Get the issuer's KEL to determine sequence number and prior event
      const kel = await getKEL(issuerIdentity.prefix);
      if (!kel) {
        showToast('Issuer KEL not found. Please create an identity first.');
        return;
      }

      // Calculate next sequence number
      const sn = kel.events.length + 1; // +1 because inception is at sn=0

      // Get prior event digest (last event in KEL)
      const priorEvent = kel.events.length > 0
        ? kel.events[kel.events.length - 1]
        : kel.inceptionEvent;
      const priorDigest = diger(JSON.stringify(priorEvent.ked || priorEvent));

      // Create registry inception event (vcp)
      const inception = registryIncept({
        issuer: issuerIdentity.prefix,
        nonce: '',
      });

      // Create KEL interaction event (ixn) that anchors the TEL inception
      const anchorEvent = interaction({
        pre: issuerIdentity.prefix,
        sn: sn,
        dig: priorDigest,
        seals: [{
          i: inception.sad.i,  // Registry AID
          d: inception.sad.d,  // Registry inception SAID (vcp.d)
        }],
      });

      // Append the anchoring event to the KEL
      await appendKELEvent(issuerIdentity.prefix, anchorEvent);

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
      showToast('Registry created and anchored in KEL');
    } catch (error) {
      console.error('Failed to create registry:', error);
      showToast(`Failed to create registry: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRegistryExport = (e: React.MouseEvent, registryAID: string) => {
    e.stopPropagation();
    // TODO: Implement export functionality
    console.log('Export registry:', registryAID);
  };

  const handleRegistryImport = (e: React.MouseEvent, registryAID: string) => {
    e.stopPropagation();
    // TODO: Implement import functionality
    console.log('Import to registry:', registryAID);
  };

  const handleRegistryShare = (e: React.MouseEvent, registryAID: string) => {
    e.stopPropagation();
    // TODO: Implement share functionality
    console.log('Share registry:', registryAID);
  };

  const handleRegistryAdd = (e: React.MouseEvent, registryAID: string) => {
    e.stopPropagation();
    setSelectedRegistryForACDC(registryAID);
    setShowAddACDCDialog(true);
  };

  const handleCreateACDC = async () => {
    if (!acdcAlias.trim() || !selectedRegistryForACDC) return;

    try {
      // Generate credential SAID (placeholder for now - should be from actual ACDC creation)
      const credentialSAID = 'E' + Array.from(crypto.getRandomValues(new Uint8Array(43)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 43);

      // Create issuance event in the TEL
      const issuanceEvent = issue({
        vcdig: credentialSAID,
        regk: selectedRegistryForACDC,
      });

      // Load the TEL registry
      const tel = await getTEL(selectedRegistryForACDC);
      if (!tel) {
        console.error('TEL registry not found:', selectedRegistryForACDC);
        return;
      }

      // Append the issuance event to the TEL
      const updatedTEL: TEL = {
        ...tel,
        events: [...tel.events, issuanceEvent],
      };

      // Save the updated TEL
      await saveTEL(updatedTEL);

      // Save alias mapping for the ACDC
      await saveAlias({
        id: crypto.randomUUID(),
        alias: acdcAlias.trim(),
        said: credentialSAID,
        type: 'acdc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('ACDC created and anchored in registry:', selectedRegistryForACDC, 'Credential:', credentialSAID);

      // Close dialog and reset
      setShowAddACDCDialog(false);
      setAcdcAlias('');
      setSelectedRegistryForACDC(null);

      showToast('ACDC created successfully', 'success');
    } catch (error) {
      console.error('Failed to add ACDC:', error);
      showToast('Failed to create ACDC', 'error');
    }
  };

  return (
    <div className="space-y-6 -m-6 p-6 min-h-full" style={{ backgroundColor: theme === 'dark' ? 'rgb(2 6 23)' : 'rgb(248 250 252)' }}>
      <Card style={{ backgroundColor: theme === 'dark' ? 'rgb(15 23 42)' : 'rgb(255 255 255)' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credential Registries</CardTitle>
          <Button onClick={handleAddRegistry} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
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
                <div
                  key={registry.registryAID}
                  className="border rounded-lg relative group"
                  style={{ backgroundColor: theme === 'dark' ? 'rgb(30 41 59)' : 'rgb(241 245 249)' }}
                  onMouseEnter={() => setHoveredRegistry(registry.registryAID)}
                  onMouseLeave={() => setHoveredRegistry(null)}
                >
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

                    {/* Button bar - fades in on hover */}
                    <div
                      className={`flex gap-1 transition-opacity duration-200 ${
                        hoveredRegistry === registry.registryAID ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryImport(e, registry.registryAID)}
                        title="Import credentials"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryExport(e, registry.registryAID)}
                        title="Export registry"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryShare(e, registry.registryAID)}
                        title="Share registry"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleRegistryAdd(e, registry.registryAID)}
                        title="Add ACDC"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {expandedRegistries.has(registry.registryAID) && (
                    <div className="border-t p-4">
                      <CredentialRegistry registryAID={registry.registryAID} />
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

      {/* Add ACDC Dialog */}
      <Dialog open={showAddACDCDialog} onOpenChange={setShowAddACDCDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New ACDC</DialogTitle>
            <DialogDescription>
              Enter an alias for the new credential. It will be incepted in the TEL and anchored to this registry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="acdc-alias">Credential Alias</Label>
              <Input
                id="acdc-alias"
                value={acdcAlias}
                onChange={(e) => setAcdcAlias(e.target.value)}
                placeholder="e.g., Employee Badge, Membership Card"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && acdcAlias.trim()) {
                    handleCreateACDC();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddACDCDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateACDC} disabled={!acdcAlias.trim()}>
              Create ACDC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
