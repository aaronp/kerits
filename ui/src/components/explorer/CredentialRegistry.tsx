import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Download, Upload, Share2, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useStore } from '@/store/useStore';
import { getTELRegistriesByIssuer, getContacts } from '@/lib/storage';
import { ACDCRow } from './ACDCRow';

interface CredentialRegistryProps {
  registryAID: string;
}

interface ContactWithAlias {
  prefix: string;
  alias: string;
  isMe: boolean;
}

export function CredentialRegistry({ registryAID }: CredentialRegistryProps) {
  const { identities } = useStore();
  const [contacts, setContacts] = useState<ContactWithAlias[]>([]);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      // Find the registry to get the issuer
      let issuerAID = '';
      let issuerAlias = '';

      for (const identity of identities) {
        const registries = await getTELRegistriesByIssuer(identity.prefix);
        const registry = registries.find(r => r.registryAID === registryAID);
        if (registry) {
          issuerAID = registry.issuerAID;
          issuerAlias = identity.alias;
          break;
        }
      }

      if (!issuerAID) return;

      // Load all contacts
      const allContacts = await getContacts();

      // Build contact list with current user first
      const contactList: ContactWithAlias[] = [
        { prefix: issuerAID, alias: issuerAlias, isMe: true }
      ];

      // Add other contacts
      allContacts.forEach(contact => {
        if (contact.prefix !== issuerAID) {
          contactList.push({
            prefix: contact.prefix,
            alias: contact.name,
            isMe: false
          });
        }
      });

      setContacts(contactList);
    };

    loadContacts();
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

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement export functionality
    console.log('Export registry:', registryAID);
  };

  const handleImport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement import functionality
    console.log('Import to registry:', registryAID);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
    console.log('Share registry:', registryAID);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement add credential functionality
    console.log('Add credential to registry:', registryAID);
  };

  return (
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
          onClick={handleImport}
          title="Import credentials"
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleExport}
          title="Export registry"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
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
          title="Add credential"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Contact list */}
      {contacts.map((contact) => (
        <div key={contact.prefix} className="ml-4">
          <div
            className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded transition-colors"
            onClick={() => toggleContact(contact.prefix)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleContact(contact.prefix);
              }}
            >
              {expandedContacts.has(contact.prefix) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <span className="font-medium">
                {contact.alias}
                {contact.isMe && (
                  <span className="text-muted-foreground"> (me)</span>
                )}
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
  );
}
