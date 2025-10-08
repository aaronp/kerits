import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Toast, useToast } from '../ui/toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { getDSL } from '@/lib/dsl';
import type { KeritsDSL } from '@kerits/app/dsl/types';
import type { SchemaField } from '@/lib/storage';
import { route } from '@/config';

const FIELD_TYPES: Array<SchemaField['type']> = ['string', 'number', 'boolean', 'date', 'email', 'url'];

export function SchemaCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([
    { name: '', type: 'string', required: true }
  ]);
  const [creating, setCreating] = useState(false);

  // Check if we came from the Explorer credential issuance flow
  const returnTo = searchParams.get('returnTo');
  const registryId = searchParams.get('registryId');

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

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', required: true }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index]!, ...updates };
    setFields(updated);
  };

  const handleCreate = async () => {
    if (!dsl) {
      showToast('System not initialized');
      return;
    }

    if (!name || fields.length === 0 || fields.some(f => !f.name)) {
      showToast('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      // Build schema definition object
      const schemaDefinition: Record<string, any> = {
        $id: `https://example.com/schemas/${name.toLowerCase().replace(/\s+/g, '-')}`,
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: name,
        type: 'object',
        properties: {},
        required: fields.filter(f => f.required).map(f => f.name),
      };

      // Only add description if it's not empty
      if (description) {
        schemaDefinition.description = description;
      }

      // Add field properties
      fields.forEach(field => {
        let fieldSchema: any = {};

        switch (field.type) {
          case 'string':
          case 'email':
          case 'url':
            fieldSchema.type = 'string';
            if (field.type === 'email') fieldSchema.format = 'email';
            if (field.type === 'url') fieldSchema.format = 'uri';
            break;
          case 'number':
            fieldSchema.type = 'number';
            break;
          case 'boolean':
            fieldSchema.type = 'boolean';
            break;
          case 'date':
            fieldSchema.type = 'string';
            fieldSchema.format = 'date-time';
            break;
        }

        // Add description if provided
        if (field.description) {
          fieldSchema.description = field.description;
        }

        schemaDefinition.properties[field.name] = fieldSchema;
      });

      // Create schema using DSL
      console.log('Creating schema with DSL:', name);
      await dsl.createSchema(name, schemaDefinition);
      console.log('Schema created successfully');

      // If we came from Explorer, return there with the new schema
      if (returnTo === 'explorer' && registryId) {
        console.log('Returning to Explorer with new schema:', name);
        navigate(route(`/dashboard?returnFromSchema=true&schemaAlias=${encodeURIComponent(name)}&registryId=${registryId}`));
      } else {
        console.log('Schemas refreshed, navigating to /dashboard/schemas');
        navigate(route('/dashboard/schemas'));
      }
    } catch (error) {
      console.error('Failed to create schema:', error);
      showToast('Failed to create schema. See console for details.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(route('/dashboard/schemas'))}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Schema</CardTitle>
          <CardDescription>
            Define a credential schema with custom fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schema Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Schema Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Onboarding Form"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A credential for a driver's license..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start">
                  {/* Field Name */}
                  <div className="col-span-5">
                    <Input
                      placeholder="Field name"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                    />
                  </div>

                  {/* Field Type */}
                  <div className="col-span-4">
                    <Select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as SchemaField['type'] })}
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Required Checkbox */}
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label className="text-sm">Required</Label>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} disabled={creating} className="flex-1">
              {creating ? 'Creating...' : 'Create Schema'}
            </Button>
            <Button variant="outline" onClick={() => navigate(route('/dashboard/schemas'))}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
