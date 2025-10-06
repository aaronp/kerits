import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Check, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Toast, useToast } from '../ui/toast';

interface SchemaDisplay {
  alias: string;
  title: string;
  description?: string;
  schemaId: string;
  properties: Record<string, any>;
}

interface SchemaListProps {
  schemas: SchemaDisplay[];
  onDelete?: () => void;
}

export function SchemaList({ schemas, onDelete }: SchemaListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDefinitions, setExpandedDefinitions] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopySchema = async (schema: SchemaDisplay) => {
    await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    showToast('Schema copied to clipboard');
  };

  const toggleDefinition = (schemaId: string) => {
    setExpandedDefinitions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(schemaId)) {
        newSet.delete(schemaId);
      } else {
        newSet.add(schemaId);
      }
      return newSet;
    });
  };

  const handleDelete = async (alias: string) => {
    if (confirm(`Are you sure you want to delete schema "${alias}"?`)) {
      // TODO: Implement schema deletion in DSL
      showToast('Schema deletion not yet implemented in DSL');
      // if (onDelete) onDelete();
    }
  };

  if (schemas.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          No schemas yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schemas.map((schema) => (
        <Card key={schema.schemaId}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{schema.title}</CardTitle>
                {schema.description && (
                  <CardDescription className="mt-1">
                    {schema.description}
                  </CardDescription>
                )}
                <CardDescription className="font-mono text-xs mt-2">
                  Alias: {schema.alias} • SAID: {schema.schemaId.substring(0, 16)}...
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === schema.schemaId ? null : schema.schemaId)}
                >
                  {expandedId === schema.schemaId ? 'Hide' : 'Details'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySchema(schema)}
                  title="Copy schema"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(schema.alias)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedId === schema.schemaId && (
            <CardContent className="space-y-4 pt-0">
              {/* Properties Table */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Properties ({Object.keys(schema.properties).length})</Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Property</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Format</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(schema.properties).map(([name, prop]: [string, any], idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono text-xs">{name}</td>
                          <td className="p-2">{prop.type || 'any'}</td>
                          <td className="p-2 text-muted-foreground">{prop.format || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Schema Definition */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDefinition(schema.schemaId)}
                  className="h-auto p-0 text-sm font-medium hover:bg-transparent text-primary hover:text-primary/80"
                >
                  {expandedDefinitions.has(schema.schemaId) ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Hide Schema Definition (JSON)
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Show Schema Definition (JSON)
                    </>
                  )}
                </Button>
                {expandedDefinitions.has(schema.schemaId) && (
                  <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-x-auto max-h-64">
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                )}
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(JSON.stringify(schema, null, 2), `export-${schema.schemaId}`)}
              >
                {copiedField === `export-${schema.schemaId}` ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Export Schema (JSON)
                  </>
                )}
              </Button>
            </CardContent>
          )}
        </Card>
      ))}
      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
