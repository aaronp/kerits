import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { route } from '@/config';

export function IssueSchemaList() {
  const { schemas } = useStore();
  const navigate = useNavigate();

  if (schemas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issue Credential</CardTitle>
          <CardDescription>Select a schema to issue a credential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No schemas available</p>
            <Button variant="outline" onClick={() => navigate(route('/schemas/new'))}>
              Create Schema
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue Credential</CardTitle>
          <CardDescription>Select a schema to issue a credential</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemas.map((schema) => (
          <Card
            key={schema.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate(route(`/dashboard/issue/${schema.id}`))}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{schema.name}</CardTitle>
                  </div>
                  {schema.description && (
                    <CardDescription className="mt-2">{schema.description}</CardDescription>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Fields: {schema.fields?.length || 0}</div>
                <div className="font-mono text-[10px] break-all">{schema.id}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
