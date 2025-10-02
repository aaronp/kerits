import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { schema } from '@/lib/keri';
import { saveSchema } from '@/lib/storage';
import { useStore } from '@/store/useStore';
import type { SchemaField, StoredSchema } from '@/lib/storage';

const FIELD_TYPES: Array<SchemaField['type']> = ['string', 'number', 'boolean', 'date', 'email', 'url'];

export function SchemaCreator() {
  const navigate = useNavigate();
  const { refreshSchemas } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([
    { name: '', type: 'string', required: true }
  ]);
  const [creating, setCreating] = useState(false);

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
    if (!name || fields.length === 0 || fields.some(f => !f.name)) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      // Build schema definition object
      const schemaDefinition: Record<string, any> = {
        $id: `https://example.com/schemas/${name.toLowerCase().replace(/\s+/g, '-')}`,
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: name,
        description: description || undefined,
        type: 'object',
        properties: {},
        required: fields.filter(f => f.required).map(f => f.name),
      };

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

        schemaDefinition.properties[field.name] = fieldSchema;
      });

      // Create KERI schema (with SAID)
      const schemaSad = schema(schemaDefinition as any);
      console.log('Created schema SAID:', schemaSad.said);

      // Save schema
      const storedSchema: StoredSchema = {
        id: schemaSad.said,
        name,
        description,
        fields,
        sad: schemaSad,
        createdAt: new Date().toISOString(),
      };

      console.log('Saving schema to IndexedDB:', storedSchema);
      await saveSchema(storedSchema);
      console.log('Schema saved successfully');

      await refreshSchemas();
      console.log('Schemas refreshed, navigating to /schemas');
      navigate('/schemas');
    } catch (error) {
      console.error('Failed to create schema:', error);
      alert('Failed to create schema. See console for details.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/schemas')}>
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
              placeholder="Driver's License"
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
            <Button variant="outline" onClick={() => navigate('/schemas')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
