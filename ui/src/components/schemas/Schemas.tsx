import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '../ui/button';
import { SchemaList } from './SchemaList';
import { Plus } from 'lucide-react';

export function Schemas() {
  const navigate = useNavigate();
  const { schemas, refreshSchemas } = useStore();

  useEffect(() => {
    refreshSchemas();
  }, [refreshSchemas]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schemas</h2>
          <p className="text-sm text-muted-foreground">
            Define credential schemas for issuing verifiable credentials
          </p>
        </div>
        <Button onClick={() => navigate('/schemas/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schema
        </Button>
      </div>

      <SchemaList schemas={schemas} onDelete={refreshSchemas} />
    </div>
  );
}
