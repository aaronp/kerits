import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { useStore } from './store/useStore';
import { Network, Users, FileText, Award, Shield } from 'lucide-react';
import { Identities } from './components/identities/Identities';
import { Schemas } from './components/schemas/Schemas';
import { SchemaCreator } from './components/schemas/SchemaCreator';
import { Credentials } from './components/credentials/Credentials';
import { CredentialIssuer } from './components/credentials/CredentialIssuer';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identities, credentials, schemas, loading, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/schemas')) return 'schemas';
    if (path.startsWith('/credentials')) return 'credentials';
    if (path.startsWith('/graph')) return 'graph';
    return 'identities';
  };

  const activeTab = getActiveTab();

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
                  onClick={() => navigate('/')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Identities
                </Button>
                <Button
                  variant={activeTab === 'schemas' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => navigate('/schemas')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Schemas
                </Button>
                <Button
                  variant={activeTab === 'credentials' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => navigate('/credentials')}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Credentials
                </Button>
                <Button
                  variant={activeTab === 'graph' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => navigate('/graph')}
                >
                  <Network className="mr-2 h-4 w-4" />
                  Network Graph
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="col-span-9">
            {loading ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  Loading...
                </CardContent>
              </Card>
            ) : (
              <Routes>
                <Route path="/" element={<Identities />} />
                <Route path="/schemas" element={<Schemas />} />
                <Route path="/schemas/new" element={<SchemaCreator />} />
                <Route path="/credentials" element={<Credentials />} />
                <Route path="/credentials/new" element={<CredentialIssuer />} />
                <Route path="/graph" element={
                  <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                      Network visualization coming soon...
                    </CardContent>
                  </Card>
                } />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
