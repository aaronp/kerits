import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useStore } from '@/store/useStore';
import { getTELRegistriesByIssuer, getContacts } from '@/lib/storage';
import type { Contact } from '@/lib/storage';
import { ACDCRow } from './ACDCRow';

interface TopicProps {
  registryAID: string;
}

interface ContactWithAlias {
  prefix: string;
  alias: string;
  isMe: boolean;
}

export function Topic({ registryAID }: TopicProps) {
  const { identities } = useStore();
  const [contacts, setContacts] = useState<ContactWithAlias[]>([]);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-2">
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
