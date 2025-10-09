import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { SchemaList } from './SchemaList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Toast, useToast } from '../ui/toast';
import { Plus, Download } from 'lucide-react';
import { route } from '@/config';
import { getDSL } from '@/lib/dsl';
import { useUser } from '@/lib/user-provider';
import type { KeritsDSL } from '@kerits/app/dsl/types';

interface SchemaDisplay {
  alias: string;
  title: string;
  description?: string;
  schemaId: string;
  properties: Record<string, any>;
}

export function Schemas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const { currentUser } = useUser();
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [schemas, setSchemas] = useState<SchemaDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

  // Initialize DSL
  useEffect(() => {
    async function init() {
      try {
        const dslInstance = await getDSL(currentUser?.id);
        setDsl(dslInstance);
      } catch (error) {
        console.error('Failed to initialize DSL:', error);
        showToast('Failed to initialize');
      }
    }
    init();
  }, [currentUser]);

  // Handle selected query parameter
  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected) {
      setSelectedSchemaId(selected);
    }
  }, [searchParams]);

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

      // Basic format check
      if (!parsed.alias || !parsed.sed || !parsed.said) {
        showToast('Invalid schema format. Expected KERI SAD format: { alias, sed, said }');
        setImporting(false);
        return;
      }

      // Check if schema already exists
      const existingAliases = await dsl.listSchemas();
      if (existingAliases.includes(parsed.alias)) {
        if (!confirm(`A schema with alias "${parsed.alias}" already exists. Replace it?`)) {
          setImporting(false);
          return;
        }
      }

      // Import schema using DSL (validates SAID and structure)
      await dsl.importSchema(parsed);

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to import schema. Please check the format.';
      showToast(errorMessage);
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
            <Download className="mr-2 h-4 w-4" />
            Import Schema
          </Button>
          <Button

            onClick={() => navigate(route('/schemas/new'))}
            className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
          selectedSchemaId={selectedSchemaId}
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
