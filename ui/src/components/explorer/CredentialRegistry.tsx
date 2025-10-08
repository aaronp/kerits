import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Share2, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useStore } from '@/store/useStore';
import { getTEL, saveTEL, getACDCsByRegistry, saveAlias } from '@/lib/storage';
import type { TEL } from '@/lib/storage';
import { ACDCRow } from './ACDCRow';
import { issue } from '@/../../src/tel';

interface CredentialRegistryProps {
  registryAID: string;
}

interface ContactWithACDCs {
  prefix: string;
  alias: string;
  isMe: boolean;
  acdcCount: number;
}

export function CredentialRegistry({ registryAID }: CredentialRegistryProps) {
  const { identities } = useStore();
  const [contacts, setContacts] = useState<ContactWithACDCs[]>([]);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [isHovered, setIsHovered] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [acdcAlias, setAcdcAlias] = useState('');

  useEffect(() => {
    const loadContactsWithACDCs = async () => {
      // Load all ACDCs for this registry
      const acdcs = await getACDCsByRegistry(registryAID);

      // Group ACDCs by recipient and count them
      const contactMap = new Map<string, { alias: string; count: number }>();

      for (const acdc of acdcs) {
        if (acdc.recipient) {
          const existing = contactMap.get(acdc.recipient);
          if (existing) {
            existing.count++;
          } else {
            // Use recipient AID as alias for now (could be enhanced with contact lookup)
            contactMap.set(acdc.recipient, {
              alias: acdc.recipient.substring(0, 12) + '...',
              count: 1
            });
          }
        }
      }

      // Build contact list from ACDCs (only show contacts with credentials)
      const contactList: ContactWithACDCs[] = Array.from(contactMap.entries()).map(([prefix, data]) => ({
        prefix,
        alias: data.alias,
        isMe: false,
        acdcCount: data.count,
      }));

      setContacts(contactList);
    };

    loadContactsWithACDCs();
  }, [registryAID, identities]);

  const toggleContact = (contactPrefix: string) => {
    setExpandedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactPrefix)) {
        newSet.delete(contactPrefix);
      } else {
        newSet.add(contactPrefix);
      }
      return newSet;
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
    console.log('Share registry:', registryAID);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('handleAdd in CredentialRegistry')
    setShowAddDialog(true);
  };

  const handleCreateACDC = async () => {
    if (!acdcAlias.trim()) return;

    try {
      // Generate credential SAID (placeholder for now - should be from actual ACDC creation)
      const credentialSAID = 'E' + Array.from(crypto.getRandomValues(new Uint8Array(43)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 43);

      // Create issuance event in the TEL
      const issuanceEvent = issue({
        vcdig: credentialSAID,
        regk: registryAID,
      });

      // Load the TEL registry
      const tel = await getTEL(registryAID);
      if (!tel) {
        console.error('TEL registry not found:', registryAID);
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

      console.log('ACDC created and anchored in registry:', registryAID, 'Credential:', credentialSAID);

      // Close dialog and reset
      setShowAddDialog(false);
      setAcdcAlias('');

      // Reload contacts to show the new ACDC
      const acdcs = await getACDCsByRegistry(registryAID);
      const contactMap = new Map<string, { alias: string; count: number }>();

      for (const acdc of acdcs) {
        if (acdc.recipient) {
          const existing = contactMap.get(acdc.recipient);
          if (existing) {
            existing.count++;
          } else {
            contactMap.set(acdc.recipient, {
              alias: acdc.recipient.substring(0, 12) + '...',
              count: 1
            });
          }
        }
      }

      const contactList: ContactWithACDCs[] = Array.from(contactMap.entries()).map(([prefix, data]) => ({
        prefix,
        alias: data.alias,
        isMe: false,
        acdcCount: data.count,
      }));

      setContacts(contactList);
    } catch (error) {
      console.error('Failed to add ACDC:', error);
    }
  };

  return (
    <>
      <div
        className="space-y-2 relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Button bar - fades in on hover */}
        <div
          className={`absolute right-2 top-2 flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleShare}
            title="Share registry"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleAdd}
            title="Add ACDC"
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Contact list - only show contacts that have credentials */}
        {contacts.map((contact) => (
          <div key={contact.prefix} className="ml-4">
            <div
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded transition-colors"
              onClick={() => toggleContact(contact.prefix)}
            >
              {/* Only show expand button if contact has credentials */}
              {contact.acdcCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleContact(contact.prefix);
                  }}
                >
                  {expandedContacts.has(contact.prefix) ? (
                    <ChevronDown className="h-4 w-4 cursor-pointer" />
                  ) : (
                    <ChevronRight className="h-4 w-4 cursor-pointer" />
                  )}
                </Button>
              )}
              <div className="flex-1">
                <span className="font-medium">
                  {contact.alias}
                  {contact.isMe && (
                    <span className="text-muted-foreground"> (me)</span>
                  )}
                  <span className="text-muted-foreground text-xs ml-2">
                    ({contact.acdcCount} credential{contact.acdcCount !== 1 ? 's' : ''})
                  </span>
                </span>
              </div>
            </div>

            {expandedContacts.has(contact.prefix) && (
              <div className="ml-8 mt-2 space-y-1">
                <ACDCRow contactPrefix={contact.prefix} registryAID={registryAID} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add ACDC Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New ACDC</DialogTitle>
            <DialogDescription>
              Enter an alias for the new credential. It will be incepted in the TEL and anchored to this registry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="alias">Credential Alias</Label>
              <Input
                id="alias"
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
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateACDC} disabled={!acdcAlias.trim()}>
              Create ACDC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
