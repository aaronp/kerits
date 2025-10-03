import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '../ui/button';
import { SchemaList } from './SchemaList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Plus, Upload } from 'lucide-react';
import { route } from '@/config';
import { saveSchema, type StoredSchema } from '@/lib/storage';

export function Schemas() {
  const navigate = useNavigate();
  const { schemas, refreshSchemas } = useStore();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    refreshSchemas();
  }, [refreshSchemas]);

  const handleImport = async () => {
    if (!importText.trim()) {
      alert('Please paste a schema');
      return;
    }

    setImporting(true);
    try {
      const parsed = JSON.parse(importText);

      let schemaToSave: StoredSchema;

      // Check if it's a full StoredSchema format (has id, name, fields)
      if (parsed.id && parsed.name && parsed.fields) {
        schemaToSave = {
          ...parsed,
          createdAt: parsed.createdAt || new Date().toISOString(),
        };
      }
      // Check if it's a SAD format (has sed, raw, said)
      else if (parsed.sed && parsed.said) {
        const sed = parsed.sed;

        // Extract schema name and fields from the SED
        if (!sed.title || !sed.properties) {
          alert('Invalid SAD format. Must include title and properties in sed.');
          return;
        }

        // Convert SED properties to fields array
        const fields = Object.entries(sed.properties).map(([name, prop]: [string, any]) => {
          let type: string = prop.type || 'string';

          // Map JSON schema types to our field types
          if (prop.format === 'email') type = 'email';
          else if (prop.format === 'uri') type = 'url';
          else if (prop.format === 'date-time') type = 'date';

          return {
            name,
            type: type as any,
            required: sed.required?.includes(name) || false,
          };
        });

        schemaToSave = {
          id: parsed.said,
          name: sed.title,
          description: sed.description,
          fields,
          sad: parsed,
          createdAt: new Date().toISOString(),
        };
      }
      // Invalid format
      else {
        alert('Invalid schema format. Must be either a StoredSchema or KERI SAD format.');
        return;
      }

      // Check if schema already exists
      if (schemas.some(s => s.id === schemaToSave.id)) {
        if (!confirm('A schema with this ID already exists. Replace it?')) {
          return;
        }
      }

      await saveSchema(schemaToSave);
      await refreshSchemas();

      setShowImportDialog(false);
      setImportText('');
      alert('Schema imported successfully');
    } catch (error) {
      console.error('Failed to import schema:', error);
      alert('Failed to import schema. Please check the format.');
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

      <SchemaList schemas={schemas} onDelete={refreshSchemas} />

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
    </div>
  );
}
