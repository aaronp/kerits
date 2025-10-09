import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Toast, useToast } from './ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { UserPlus, Users, Trash2, Copy } from 'lucide-react';
import { getDSL } from '../lib/dsl';
import { route } from '../config';
import { VisualId } from './ui/visual-id';
import { useUser } from '../lib/user-provider';

// Local interface matching DSL Contact type
interface Contact {
  aid: string;
  metadata?: {
    alias?: string;
    name?: string;
    createdAt?: string;
  };
}

export function Contacts() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactKEL, setNewContactKEL] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadContacts();
  }, [currentUser]);

  const loadContacts = async () => {
    try {
      if (!currentUser) return;

      const dsl = await getDSL(currentUser.id);
      const contactsDsl = dsl.contacts();
      const allContacts = await contactsDsl.getAll();

      // Transform DSL contacts to local format
      const transformedContacts: Contact[] = allContacts.map(c => ({
        aid: c.aid,
        metadata: c.metadata,
      }));

      setContacts(transformedContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      showToast('Failed to load contacts');
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim()) {
      showToast('Please enter a contact name');
      return;
    }

    if (!newContactKEL.trim()) {
      showToast('Please paste the KEL data');
      return;
    }

    setLoading(true);
    try {
      const dsl = await getDSL(currentUser?.id);
      let kelData: any[];
      let prefix: string;

      // Parse CESR format (raw text format from export)
      try {
        // Parse events into array format using balanced brace counting
        kelData = [];
        const cesrText = newContactKEL.trim();
        let offset = 0;

        while (offset < cesrText.length) {
          // Skip non-JSON characters (version strings, whitespace)
          while (offset < cesrText.length && cesrText[offset] !== '{') {
            offset++;
          }

          if (offset >= cesrText.length) break;

          // Find balanced JSON object
          let braceCount = 0;
          let start = offset;

          for (let i = offset; i < cesrText.length; i++) {
            if (cesrText[i] === '{') {
              braceCount++;
            } else if (cesrText[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                const jsonText = cesrText.slice(start, i + 1);
                try {
                  const eventJson = JSON.parse(jsonText);
                  kelData.push(eventJson);
                } catch (e) {
                  console.error('Failed to parse event JSON:', e);
                }
                offset = i + 1;
                break;
              }
            }
          }

          if (braceCount !== 0) break; // Incomplete JSON
        }

        if (kelData.length === 0) {
          throw new Error('No events parsed from CESR');
        }

        // Extract AID from first event
        const firstEvent = kelData[0];
        prefix = firstEvent.i || firstEvent.pre;
        if (!prefix) {
          throw new Error('Could not find AID in first event');
        }
      } catch (cesrError) {
        // If CESR parsing fails, try JSON format
        try {
          kelData = JSON.parse(newContactKEL);

          if (!Array.isArray(kelData) || kelData.length === 0) {
            showToast('Invalid KEL format - must be a non-empty array');
            setLoading(false);
            return;
          }

          // Extract prefix from the first event
          const firstEvent = kelData[0];
          prefix = firstEvent.pre || firstEvent.i || firstEvent.ked?.i;

          if (!prefix) {
            showToast('Could not find prefix in KEL data');
            setLoading(false);
            return;
          }
        } catch (jsonError) {
          showToast('Invalid format - must be CESR or JSON KEL data');
          setLoading(false);
          return;
        }
      }

      // Check if contact with this AID already exists via DSL
      const contactsDsl = dsl.contacts();
      const alias = newContactName.trim().toLowerCase().replace(/\s+/g, '-');
      const existingContact = await contactsDsl.get(alias);

      if (existingContact) {
        showToast(`Contact already exists with alias '${alias}'`);
        setLoading(false);
        return;
      }

      // Convert CESR text to Uint8Array for DSL import
      const cesrBytes = new TextEncoder().encode(newContactKEL.trim());
      const importedContact = await contactsDsl.importKEL(cesrBytes, alias);

      console.log(`[Contacts] Imported contact via DSL: ${alias} -> ${importedContact.aid}`);

      await loadContacts();

      // Reset form
      setNewContactName('');
      setNewContactKEL('');
      setIsDialogOpen(false);
      showToast(`Contact "${alias}" added successfully`);
    } catch (error) {
      console.error('Failed to add contact:', error);
      showToast(`Failed to add contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    const contactName = contact.metadata?.name || contact.metadata?.alias || contact.aid.substring(0, 8);
    const contactAlias = contact.metadata?.alias || contactName.toLowerCase().replace(/\s+/g, '-');

    if (!confirm(`Delete contact "${contactName}"?`)) {
      return;
    }

    try {
      const dsl = await getDSL(currentUser?.id);
      const contactsDsl = dsl.contacts();
      await contactsDsl.remove(contactAlias);

      await loadContacts();
      showToast(`Contact "${contactName}" deleted`);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      showToast('Failed to delete contact');
    }
  };

  const handleCopyPrefix = async (prefix: string) => {
    await navigator.clipboard.writeText(prefix);
    showToast('Prefix copied to clipboard');
  };

  const handleCancelAdd = () => {
    setNewContactName('');
    setNewContactKEL('');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                Contacts
              </CardTitle>
              <CardDescription>Manage your KERI contacts</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contacts yet</p>
              <p className="text-sm">Add your first contact to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const contactName = contact.metadata?.name || contact.metadata?.alias || contact.aid.substring(0, 8);
                const createdAt = contact.metadata?.createdAt || new Date().toISOString();

                return (
                  <Card key={contact.aid} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div
                              className="cursor-pointer"
                              onClick={() => navigate(route(`/contacts/${contact.aid}`))}
                            >
                              <VisualId
                                label={contactName}
                                value={contact.aid}
                                showCopy={false}
                                bold={true}
                                size={40}
                                maxCharacters={12}
                              />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Added: {new Date(createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyPrefix(contact.aid)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy AID
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContact(contact)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the contact's name and paste their KEL data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contact Name</Label>
              <Input
                id="name"
                placeholder="Enter contact name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kel">KEL Data (CESR or JSON)</Label>
              <Textarea
                id="kel"
                placeholder="Paste the KEL data here (CESR or JSON format)..."
                value={newContactKEL}
                onChange={(e) => setNewContactKEL(e.target.value)}
                className="font-mono text-xs resize-none"
                rows={8}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelAdd}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={loading}>
              {loading ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
