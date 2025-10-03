import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useStore } from '../store/useStore';
import { Network, FileText, Award, Moon, Sun, LogOut, UserCircle, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Schemas } from './schemas/Schemas';
import { SchemaCreator } from './schemas/SchemaCreator';
import { Credentials } from './credentials/Credentials';
import { CredentialIssuer } from './credentials/CredentialIssuer';
import { NetworkGraph } from './graph/NetworkGraph';
import { Profile } from './Profile';
import { useTheme } from '../lib/theme-provider';
import { useUser } from '../lib/user-provider';
import { route } from '../config';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identities, credentials, schemas, loading, init } = useStore();
  const { theme, setTheme } = useTheme();
  const { currentUser, logout } = useUser();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    // Redirect to root if no user is logged in
    if (!currentUser) {
      navigate(route('/'), { replace: true });
    }
  }, [currentUser, navigate]);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/schemas')) return 'schemas';
    if (path.includes('/dashboard/credentials')) return 'credentials';
    if (path.includes('/dashboard/graph')) return 'graph';
    if (path.includes('/dashboard/profile')) return 'profile';
    return 'schemas';
  };

  const activeTab = getActiveTab();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(route('/'), { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}kerits.jpg`} alt="KERI" className="h-12 w-12 rounded-md object-cover" />
              <div>
                <h1 className="text-2xl font-bold">KERITS</h1>
                <p className="text-sm text-muted-foreground">
                  Key Event Receipt Infrastructure (TypeScript)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {identities.length} Identities · {schemas.length} Schemas · {credentials.length} Credentials
              </div>
              <div className="flex items-center gap-2 border-l pl-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">{currentUser.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(route('/dashboard/profile'))}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="col-span-3">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 flex-1 flex flex-col">
                <div className="flex-1 space-y-2">
                  <Button
                    variant={activeTab === 'schemas' ? 'default' : 'ghost'}
                    className={`w-full justify-start ${activeTab === 'schemas' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                    onClick={() => navigate(route('/dashboard/schemas'))}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Schemas
                  </Button>
                  <Button
                    variant={activeTab === 'credentials' ? 'default' : 'ghost'}
                    className={`w-full justify-start ${activeTab === 'credentials' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                    onClick={() => navigate(route('/dashboard/credentials'))}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Credentials
                  </Button>
                  <Button
                    variant={activeTab === 'graph' ? 'default' : 'ghost'}
                    className={`w-full justify-start ${activeTab === 'graph' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                    onClick={() => navigate(route('/dashboard/graph'))}
                  >
                    <Network className="mr-2 h-4 w-4" />
                    Network Graph
                  </Button>
                </div>

                {/* Theme Toggle at Bottom */}
                <div className="border-t pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                </div>
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
                <Route path="/" element={<Schemas />} />
                <Route path="/schemas" element={<Schemas />} />
                <Route path="/schemas/new" element={<SchemaCreator />} />
                <Route path="/credentials" element={<Credentials />} />
                <Route path="/credentials/new" element={<CredentialIssuer />} />
                <Route path="/graph" element={<NetworkGraph />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
