import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { useStore } from './store/useStore';
import { Network, Users, FileText, Award, Shield } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'identities' | 'schemas' | 'credentials' | 'graph'>('identities');
  const { identities, credentials, schemas } = useStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">KERI Demo</h1>
                <p className="text-sm text-muted-foreground">
                  Key Event Receipt Infrastructure
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {identities.length} Identities · {schemas.length} Schemas · {credentials.length} Credentials
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'identities' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('identities')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Identities
                </Button>
                <Button
                  variant={activeTab === 'schemas' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('schemas')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Schemas
                </Button>
                <Button
                  variant={activeTab === 'credentials' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('credentials')}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Credentials
                </Button>
                <Button
                  variant={activeTab === 'graph' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('graph')}
                >
                  <Network className="mr-2 h-4 w-4" />
                  Network Graph
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'identities' && 'Identity Management'}
                  {activeTab === 'schemas' && 'Schema Management'}
                  {activeTab === 'credentials' && 'Credential Management'}
                  {activeTab === 'graph' && 'Network Visualization'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'identities' && 'Create and manage KERI identities (AIDs)'}
                  {activeTab === 'schemas' && 'Define credential schemas'}
                  {activeTab === 'credentials' && 'Issue and accept verifiable credentials'}
                  {activeTab === 'graph' && 'Visualize KEL and TEL events'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === 'identities' && (
                  <div className="text-center py-12 text-muted-foreground">
                    Identity management coming soon...
                  </div>
                )}
                {activeTab === 'schemas' && (
                  <div className="text-center py-12 text-muted-foreground">
                    Schema management coming soon...
                  </div>
                )}
                {activeTab === 'credentials' && (
                  <div className="text-center py-12 text-muted-foreground">
                    Credential management coming soon...
                  </div>
                )}
                {activeTab === 'graph' && (
                  <div className="text-center py-12 text-muted-foreground">
                    Network visualization coming soon...
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
