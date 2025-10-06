import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { SchemaList } from './SchemaList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Toast, useToast } from '../ui/toast';
import { Plus, Upload } from 'lucide-react';
import { route } from '@/config';
import { getDSL } from '@/lib/dsl';
import type { KeritsDSL } from '@/../src/app/dsl/types';

interface SchemaDisplay {
  alias: string;
  title: string;
  description?: string;
  schemaId: string;
  properties: Record<string, any>;
}

export function Schemas() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [schemas, setSchemas] = useState<SchemaDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // Initialize DSL
  useEffect(() => {
    async function init() {
      try {
        const dslInstance = await getDSL();
        setDsl(dslInstance);
      } catch (error) {
        console.error('Failed to initialize DSL:', error);
        showToast('Failed to initialize');
      }
    }
    init();
  }, []);

  // Load schemas
  useEffect(() => {
    if (!dsl) return;

    async function loadSchemas() {
      try {
        const aliases = await dsl.listSchemas();
        const schemaList: SchemaDisplay[] = [];

        for (const alias of aliases) {
          const schemaDsl = await dsl.schema(alias);
          if (schemaDsl) {
            schemaList.push({
              alias,
              title: schemaDsl.schema.schema?.title || alias,
              description: schemaDsl.schema.schema?.description,
              schemaId: schemaDsl.schema.schemaId,
              properties: schemaDsl.schema.schema?.properties || {},
            });
          }
        }

        setSchemas(schemaList);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load schemas:', error);
        showToast('Failed to load schemas');
        setLoading(false);
      }
    }

    loadSchemas();
  }, [dsl]);

  const handleImport = async () => {
    if (!dsl) {
      showToast('System not initialized');
      return;
    }

    if (!importText.trim()) {
      showToast('Please paste a schema');
      return;
    }

    setImporting(true);
    try {
      const parsed = JSON.parse(importText);

      let alias: string;
      let schemaDefinition: any;

      // Check if it's a full StoredSchema format (has id, name, fields)
      if (parsed.id && parsed.name && parsed.fields) {
        alias = parsed.name;
        // Reconstruct schema definition from fields
        schemaDefinition = {
          $id: `https://example.com/schemas/${parsed.name.toLowerCase().replace(/\s+/g, '-')}`,
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: parsed.name,
          type: 'object',
          properties: {},
          required: parsed.fields.filter((f: any) => f.required).map((f: any) => f.name),
        };
        if (parsed.description) {
          schemaDefinition.description = parsed.description;
        }
        parsed.fields.forEach((field: any) => {
          let fieldSchema: any = { type: field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string' };
          if (field.type === 'email') fieldSchema.format = 'email';
          if (field.type === 'url') fieldSchema.format = 'uri';
          if (field.type === 'date') fieldSchema.format = 'date-time';
          if (field.description) fieldSchema.description = field.description;
          schemaDefinition.properties[field.name] = fieldSchema;
        });
      }
      // Check if it's a SAD format (has sed, raw, said)
      else if (parsed.sed && parsed.said) {
        const sed = parsed.sed;

        // Extract schema name and fields from the SED
        if (!sed.title || !sed.properties) {
          showToast('Invalid SAD format. Must include title and properties in sed.');
          return;
        }

        alias = sed.title;
        schemaDefinition = sed;
      }
      // Invalid format
      else {
        showToast('Invalid schema format. Must be either a StoredSchema or KERI SAD format.');
        return;
      }

      // Check if schema already exists
      const existingAliases = await dsl.listSchemas();
      if (existingAliases.includes(alias)) {
        if (!confirm(`A schema with alias "${alias}" already exists. Replace it?`)) {
          setImporting(false);
          return;
        }
      }

      // Create schema using DSL
      await dsl.createSchema(alias, schemaDefinition);

      // Reload schemas
      const aliases = await dsl.listSchemas();
      const schemaList: SchemaDisplay[] = [];
      for (const a of aliases) {
        const schemaDsl = await dsl.schema(a);
        if (schemaDsl) {
          schemaList.push({
            alias: a,
            title: schemaDsl.schema.schema?.title || a,
            description: schemaDsl.schema.schema?.description,
            schemaId: schemaDsl.schema.schemaId,
            properties: schemaDsl.schema.schema?.properties || {},
          });
        }
      }
      setSchemas(schemaList);

      setShowImportDialog(false);
      setImportText('');
      showToast('Schema imported successfully');
    } catch (error) {
      console.error('Failed to import schema:', error);
      showToast('Failed to import schema. Please check the format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schemas</h2>
          <p className="text-sm text-muted-foreground">
            Define credential schemas for issuing verifiable credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Schema
          </Button>
          <Button
            onClick={() => navigate(route('/dashboard/schemas/new'))}
            className="border shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Schema
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading schemas...</div>
      ) : (
        <SchemaList
          schemas={schemas}
          onDelete={async () => {
            // Reload schemas after deletion
            if (dsl) {
              const aliases = await dsl.listSchemas();
              const schemaList: SchemaDisplay[] = [];
              for (const a of aliases) {
                const schemaDsl = await dsl.schema(a);
                if (schemaDsl) {
                  schemaList.push({
                    alias: a,
                    title: schemaDsl.schema.schema?.title || a,
                    description: schemaDsl.schema.schema?.description,
                    schemaId: schemaDsl.schema.schemaId,
                    properties: schemaDsl.schema.schema?.properties || {},
                  });
                }
              }
              setSchemas(schemaList);
            }
          }}
        />
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Schema</DialogTitle>
            <DialogDescription>
              Paste a schema JSON that was copied from another instance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder='{"id": "...", "name": "...", "fields": [...], ...}'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing} className="flex-1">
                {importing ? 'Importing...' : 'Import Schema'}
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
