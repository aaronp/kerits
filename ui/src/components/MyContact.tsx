import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { CopyableText } from './ui/copyable-text';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ArrowLeft, Users, RefreshCw, ChevronDown, ChevronRight, Search, Copy } from 'lucide-react';
import { Toast, useToast } from './ui/toast';
import { route } from '../config';
import { IdentityEventGraph } from './graph/IdentityEventGraph';
import { useUser } from '../lib/user-provider';
import { getDSL } from '../lib/dsl';

interface Contact {
  alias: string;
  aid: string;
  kel: any[];
  metadata?: {
    createdAt?: string;
    notes?: string;
  };
}

export function MyContact() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updatedKEL, setUpdatedKEL] = useState('');
  const [kelError, setKelError] = useState('');
  const [isKelValid, setIsKelValid] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAllKeys, setShowAllKeys] = useState(false);
  const [keyFilter, setKeyFilter] = useState('');
  const [telRefreshTrigger, setTelRefreshTrigger] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadContact();
  }, [identifier]);

  const loadContact = async () => {
    if (!identifier || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      const dsl = await getDSL(currentUser.id);
      const contactsDsl = dsl.contacts();

      // Try to find by alias first
      let foundContact = await contactsDsl.get(identifier);

      // If not found by alias, search all contacts by AID prefix
      if (!foundContact) {
        const allContacts = await contactsDsl.getAll();
        foundContact = allContacts.find(c => c.aid.startsWith(identifier) || c.aid === identifier) || null;
      }

      // Transform DSL Contact to component Contact format
      if (foundContact) {
        setContact({
          alias: foundContact.alias,
          aid: foundContact.aid,
          kel: foundContact.kel || [],
          metadata: foundContact.metadata,
        });
      } else {
        setContact(null);
      }
    } catch (error) {
      console.error('Failed to load contact:', error);
      showToast('Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  // Validate updated KEL
  useEffect(() => {
    if (!updatedKEL.trim() || !contact) {
      setKelError('');
      setIsKelValid(false);
      return;
    }

    try {
      // Parse CESR format
      const events: any[] = [];
      const cesrText = updatedKEL.trim();
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
                events.push(eventJson);
              } catch (e) {
                // Skip invalid JSON
              }
              offset = i + 1;
              break;
            }
          }
        }

        if (braceCount !== 0) break; // Incomplete JSON
      }

      if (events.length === 0) {
        setKelError('No valid events found in CESR data');
        setIsKelValid(false);
        return;
      }

      if (events.length < contact.kel.length) {
        setKelError(`KEL is shorter than current KEL (${events.length} vs ${contact.kel.length} events)`);
        setIsKelValid(false);
        return;
      }

      // Verify AID matches
      const firstEvent = events[0];
      const aid = firstEvent.pre || firstEvent.i || firstEvent.d;
      if (aid !== contact.aid) {
        setKelError(`KEL AID (${aid?.substring(0, 12)}...) does not match contact AID (${contact.aid.substring(0, 12)}...)`);
        setIsKelValid(false);
        return;
      }

      setKelError('');
      setIsKelValid(true);
    } catch (error) {
      setKelError('Failed to validate KEL: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsKelValid(false);
    }
  }, [updatedKEL, contact]);

  const handleUpdateKEL = async () => {
    if (!contact || !isKelValid || !currentUser) return;

    setUpdating(true);
    try {
      const dsl = await getDSL(currentUser.id);
      const contactsDsl = dsl.contacts();

      // Remove old contact
      await contactsDsl.remove(contact.alias);

      // Import updated KEL using importKEL (accepts CESR format)
      const cesrBytes = new TextEncoder().encode(updatedKEL.trim());
      const updatedContact = await contactsDsl.importKEL(cesrBytes, contact.alias);

      // Reload contact to get updated KEL
      await loadContact();

      setIsUpdateDialogOpen(false);
      setUpdatedKEL('');
      showToast('Contact KEL updated successfully');
    } catch (error) {
      console.error('Failed to update contact:', error);
      showToast('Failed to update contact: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelUpdate = () => {
    setUpdatedKEL('');
    setKelError('');
    setIsKelValid(false);
    setIsUpdateDialogOpen(false);
  };

  const handleCopyAID = async () => {
    if (contact) {
      await navigator.clipboard.writeText(contact.aid);
      showToast('AID copied to clipboard');
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    showToast('Public key copied to clipboard');
  };

  // Extract all public keys from KEL events
  const allKeys = useMemo(() => {
    if (!contact) return [];

    const keys: Array<{ key: string; event: number; type: string; date?: string }> = [];

    contact.kel.forEach((event: any, index: number) => {
      const eventType = event.t || event.ked?.t || '';
      const eventDate = event.dt || event.ked?.dt;
      const eventKeys = event.k || event.keys || event.ked?.k || event.ked?.keys || [];

      // Convert event type to friendly name
      let friendlyType = eventType;
      if (eventType === 'icp') {
        friendlyType = 'First Key';
      } else if (eventType === 'rot') {
        friendlyType = 'Key Rotation';
      }

      if (Array.isArray(eventKeys)) {
        eventKeys.forEach((key: string) => {
          keys.push({
            key,
            event: index + 1, // Make events 1-based
            type: friendlyType,
            date: eventDate,
          });
        });
      }
    });

    return keys;
  }, [contact]);

  // Get current public key (from latest event)
  const currentPublicKey = useMemo(() => {
    if (allKeys.length === 0) return null;
    return allKeys[allKeys.length - 1].key;
  }, [allKeys]);

  // Filter keys based on search
  const filteredKeys = useMemo(() => {
    if (!keyFilter.trim()) return allKeys;
    return allKeys.filter(k =>
      k.key.toLowerCase().includes(keyFilter.toLowerCase()) ||
      k.type.toLowerCase().includes(keyFilter.toLowerCase())
    );
  }, [allKeys, keyFilter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          Loading contact...
        </CardContent>
      </Card>
    );
  }

  if (!contact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Not Found</CardTitle>
          <CardDescription>The requested contact could not be found</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate(route('/contacts'))}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(route('/contacts'))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <div>
                  <CardTitle>{contact.alias}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs font-mono text-muted-foreground">
                      {contact.aid}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyAID()}
                      className="h-5 w-5 p-0"
                      title="Copy AID"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateDialogOpen(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update KEL
              </Button>
            </div>
          </div>
        </CardHeader>
        {showDetails && (
          <CardContent className="space-y-4">
            <div className="space-y-3">

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Public Key</div>
                {allKeys.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllKeys(!showAllKeys)}
                    className="h-6 text-xs text-primary hover:text-primary/80"
                  >
                    {showAllKeys ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Hide History
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Show History ({allKeys.length - 1} previous)
                      </>
                    )}
                  </Button>
                )}
              </div>
              {currentPublicKey && (
                <CopyableText
                  text={currentPublicKey}
                  label="Public Key"
                  onCopy={() => showToast('Public key copied to clipboard')}
                />
              )}

              {showAllKeys && allKeys.length > 1 && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter keys..."
                      value={keyFilter}
                      onChange={(e) => setKeyFilter(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredKeys.map((keyInfo, index) => (
                      <div key={index} className="space-y-1">
                        <CopyableText
                          text={keyInfo.key}
                          label="Public Key"
                          onCopy={() => showToast('Public key copied to clipboard')}
                        />
                        <div className="text-xs text-muted-foreground px-3">
                          Event {keyInfo.event} • {keyInfo.type || 'Unknown'}
                          {keyInfo.date && (
                            <> • {new Date(keyInfo.date).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredKeys.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No keys match your filter
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
              <div>
                <div className="font-medium">Added</div>
                <div className="text-muted-foreground">
                  {contact.metadata?.createdAt ? new Date(contact.metadata.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
              <div>
                <div className="font-medium">KEL Events</div>
                <div className="text-muted-foreground">{contact.kel.length}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <IdentityEventGraph
        alias={contact.alias}
        prefix={contact.aid}
        inceptionEvent={contact.kel[0]}
        kelEvents={contact.kel.slice(1)}
        showTEL={true}
        credentials={[]}
        telRefreshTrigger={telRefreshTrigger}
      />

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update KEL</DialogTitle>
            <DialogDescription>
              Paste the updated KEL for {contact.alias}. The KEL must be valid and cannot be shorter than the current KEL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="updated-kel">Updated KEL Data (CESR)</Label>
              <Textarea
                id="updated-kel"
                placeholder="Paste the updated KEL in CESR format here..."
                value={updatedKEL}
                onChange={(e) => setUpdatedKEL(e.target.value)}
                className="font-mono text-xs resize-none"
                rows={10}
              />
              {kelError && (
                <div className="text-sm text-destructive">
                  {kelError}
                </div>
              )}
              {isKelValid && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  ✓ KEL is valid
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Current KEL has {contact.kel.length} events
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelUpdate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateKEL}
              disabled={!isKelValid || updating}
            >
              {updating ? 'Updating...' : 'OK'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
