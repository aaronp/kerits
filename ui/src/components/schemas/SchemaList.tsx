import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Check, Trash2 } from 'lucide-react';
import type { StoredSchema } from '@/lib/storage';
import { deleteSchema } from '@/lib/storage';

interface SchemaListProps {
  schemas: StoredSchema[];
  onDelete?: () => void;
}

export function SchemaList({ schemas, onDelete }: SchemaListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete schema "${name}"?`)) {
      await deleteSchema(id);
      if (onDelete) onDelete();
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
        <Card key={schema.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{schema.name}</CardTitle>
                {schema.description && (
                  <CardDescription className="mt-1">
                    {schema.description}
                  </CardDescription>
                )}
                <CardDescription className="font-mono text-xs mt-2">
                  {schema.id}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === schema.id ? null : schema.id)}
                >
                  {expandedId === schema.id ? 'Hide' : 'Details'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(schema.id, schema.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedId === schema.id && (
            <CardContent className="space-y-4 pt-0">
              {/* Fields Table */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fields ({schema.fields.length})</Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schema.fields.map((field, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono text-xs">{field.name}</td>
                          <td className="p-2">{field.type}</td>
                          <td className="p-2">{field.required ? '✓' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Schema Definition */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Schema Definition (JSON)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(schema.sad, null, 2), `schema-${schema.id}`)}
                  >
                    {copiedField === `schema-${schema.id}` ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-x-auto max-h-64">
                  {JSON.stringify(schema.sad, null, 2)}
                </pre>
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(JSON.stringify(schema, null, 2), `export-${schema.id}`)}
              >
                {copiedField === `export-${schema.id}` ? (
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
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
