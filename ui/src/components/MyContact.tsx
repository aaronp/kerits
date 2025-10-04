import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import type { Node, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ArrowLeft, Users, Copy, RefreshCw } from 'lucide-react';
import { getContactByPrefix, getContactByName, saveContact } from '../lib/storage';
import { Toast, useToast } from './ui/toast';
import { route } from '../config';
import type { Contact } from '../lib/storage';

// Custom node component for KEL events
function EventNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg border-2 bg-card shadow-md min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="space-y-1">
        <div className="font-semibold text-sm text-card-foreground">{data.label}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {data.type}
        </div>
        {data.sn !== undefined && (
          <div className="text-xs text-muted-foreground">
            Sequence: {data.sn}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
}

const nodeTypes = {
  event: EventNode,
};

export function MyContact() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updatedKEL, setUpdatedKEL] = useState('');
  const [kelError, setKelError] = useState('');
  const [isKelValid, setIsKelValid] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadContact();
  }, [identifier]);

  const loadContact = async () => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    try {
      // Try to find by prefix (SAID) first, then by name
      let foundContact = await getContactByPrefix(identifier);
      if (!foundContact) {
        foundContact = await getContactByName(identifier);
      }

      setContact(foundContact || null);
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
      const kelData = JSON.parse(updatedKEL);

      if (!Array.isArray(kelData)) {
        setKelError('KEL must be a JSON array');
        setIsKelValid(false);
        return;
      }

      if (kelData.length === 0) {
        setKelError('KEL cannot be empty');
        setIsKelValid(false);
        return;
      }

      if (kelData.length < contact.kel.length) {
        setKelError(`KEL is shorter than current KEL (${kelData.length} vs ${contact.kel.length} events)`);
        setIsKelValid(false);
        return;
      }

      // Verify prefix matches
      const firstEvent = kelData[0];
      const prefix = firstEvent.pre || firstEvent.i || firstEvent.ked?.i;
      if (prefix !== contact.prefix) {
        setKelError('KEL prefix does not match contact prefix');
        setIsKelValid(false);
        return;
      }

      setKelError('');
      setIsKelValid(true);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setKelError('Invalid JSON format');
      } else {
        setKelError('Failed to validate KEL');
      }
      setIsKelValid(false);
    }
  }, [updatedKEL, contact]);

  const handleUpdateKEL = async () => {
    if (!contact || !isKelValid) return;

    setUpdating(true);
    try {
      const kelData = JSON.parse(updatedKEL);

      const updatedContact: Contact = {
        ...contact,
        kel: kelData,
      };

      await saveContact(updatedContact);
      setContact(updatedContact);
      setIsUpdateDialogOpen(false);
      setUpdatedKEL('');
      showToast('Contact KEL updated successfully');
    } catch (error) {
      console.error('Failed to update contact:', error);
      showToast('Failed to update contact');
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

  // Build KEL graph for contact
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!contact) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add inception event (first event in KEL)
    const inceptionEvent = contact.kel[0];
    if (inceptionEvent) {
      nodes.push({
        id: 'inception',
        type: 'event',
        position: { x: 50, y: 150 },
        data: {
          label: `Inception (${contact.name})`,
          type: inceptionEvent.t || inceptionEvent.ked?.t || 'icp',
          sn: 0,
          event: inceptionEvent,
        },
      });
    }

    // Add subsequent events (rotations, etc.)
    contact.kel.slice(1).forEach((event: any, index: number) => {
      const eventId = `event-${index}`;
      const prevId = index === 0 ? 'inception' : `event-${index - 1}`;

      nodes.push({
        id: eventId,
        type: 'event',
        position: { x: 300 + (index * 300), y: 150 },
        data: {
          label: `Event ${index + 1}`,
          type: event.t || event.ked?.t || 'rot',
          sn: index + 1,
          event,
        },
      });

      edges.push({
        id: `edge-${prevId}-${eventId}`,
        source: prevId,
        target: eventId,
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      });
    });

    return { nodes, edges };
  }, [contact]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleCopyPrefix = async () => {
    if (contact) {
      await navigator.clipboard.writeText(contact.prefix);
      showToast('Prefix copied to clipboard');
    }
  };

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
          <Button onClick={() => navigate(route('/dashboard/contacts'))}>
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
                onClick={() => navigate(route('/dashboard/contacts'))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  {contact.name}
                </CardTitle>
                <CardDescription>Contact details and key event log</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUpdateDialogOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update KEL
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Prefix (AID)</div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono text-muted-foreground break-all flex-1">
                {contact.prefix}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrefix}
                className="h-6 w-6 p-0 flex-shrink-0"
                title="Copy Prefix"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Added</div>
              <div className="text-muted-foreground">
                {new Date(contact.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="font-medium">KEL Events</div>
              <div className="text-muted-foreground">{contact.kel.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Event Log</CardTitle>
          <CardDescription>Visual representation of the key event history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] border rounded-lg bg-background">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              <Controls />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update KEL</DialogTitle>
            <DialogDescription>
              Paste the updated KEL for {contact.name}. The KEL must be valid and cannot be shorter than the current KEL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="updated-kel">Updated KEL Data (JSON)</Label>
              <Textarea
                id="updated-kel"
                placeholder="Paste the updated KEL JSON data here..."
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
