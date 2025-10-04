import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Toast, useToast } from './ui/toast';
import { useStore } from '../store/useStore';
import { Network, FileText, Award, Moon, Sun, LogOut, UserCircle, User, ShieldCheck, Pencil, Users, Share2 } from 'lucide-react';
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
import { VerifyCredential } from './credentials/VerifyCredential';
import { NetworkGraph } from './graph/NetworkGraph';
import { Profile } from './Profile';
import { Sign } from './signing/Sign';
import { IssueSchemaList } from './issue/IssueSchemaList';
import { IssueCredentialForm } from './issue/IssueCredentialForm';
import { Contacts } from './Contacts';
import { MyContact } from './MyContact';
import { useTheme } from '../lib/theme-provider';
import { useUser } from '../lib/user-provider';
import { route } from '../config';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identities, credentials, schemas, loading, init } = useStore();
  const { theme, setTheme } = useTheme();
  const { currentUser, logout } = useUser();
  const { toast, showToast, hideToast } = useToast();
  const [bannerColor, setBannerColor] = useState<string>('#3b82f6');

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    // Redirect to root if no user is logged in
    if (!currentUser) {
      navigate(route('/'), { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Load banner color from localStorage
    const savedColor = localStorage.getItem('kerits-banner-color');
    if (savedColor) {
      setBannerColor(savedColor);
    }

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kerits-banner-color' && e.newValue) {
        setBannerColor(e.newValue);
      }
    };

    // Listen for custom event for same-window updates
    const handleColorUpdate = () => {
      const savedColor = localStorage.getItem('kerits-banner-color');
      if (savedColor) {
        setBannerColor(savedColor);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kerits-color-changed', handleColorUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kerits-color-changed', handleColorUpdate);
    };
  }, []);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/schemas')) return 'schemas';
    if (path.includes('/dashboard/issue')) return 'issue';
    if (path.includes('/dashboard/credentials')) return 'credentials';
    if (path.includes('/dashboard/verify')) return 'verify';
    if (path.includes('/dashboard/sign')) return 'sign';
    if (path.includes('/dashboard/graph')) return 'graph';
    if (path.includes('/dashboard/contacts')) return 'contacts';
    if (path.includes('/dashboard/profile')) return 'profile';
    return 'schemas';
  };

  const activeTab = getActiveTab();

  const handleShareKEL = async () => {
    if (identities.length === 0) {
      showToast('No identity to share');
      return;
    }

    const identity = identities[0];
    const kelString = JSON.stringify(identity.kel, null, 2);
    await navigator.clipboard.writeText(kelString);
    showToast('KEL copied to clipboard');
  };

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
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Fixed */}
      <header className="border-b flex-shrink-0" style={{ backgroundColor: bannerColor }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src='/kerits/kerits.jpg' alt="KERI" className="h-12 w-12 rounded-md object-cover" />
              <div>
                <h1 className="text-2xl font-bold text-white">KERITS</h1>
                <p className="text-sm text-white/80">
                  Key Event Receipt Infrastructure (TypeScript)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/80">
                {identities.length} Identities · {schemas.length} Schemas · {credentials.length} Credentials
              </div>
              <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
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
                    <DropdownMenuItem onClick={handleShareKEL}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
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

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Sidebar Navigation - Fixed */}
            <aside className="col-span-3 overflow-y-auto">
              <Card className="flex flex-col h-full sticky top-0">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 flex-1 flex flex-col">
                <div className="flex-1 space-y-2">
                  {schemas.length > 0 && (
                    <Button
                      variant={activeTab === 'issue' ? 'default' : 'ghost'}
                      className={`w-full justify-start ${activeTab === 'issue' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                      onClick={() => navigate(route('/dashboard/issue'))}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Issue
                    </Button>
                  )}
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
                    variant={activeTab === 'sign' ? 'default' : 'ghost'}
                    className={`w-full justify-start ${activeTab === 'sign' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                    onClick={() => navigate(route('/dashboard/sign'))}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Sign
                  </Button>
                  <Button
                    variant={activeTab === 'graph' ? 'default' : 'ghost'}
                    className={`w-full justify-start ${activeTab === 'graph' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                    onClick={() => navigate(route('/dashboard/graph'))}
                  >
                    <Network className="mr-2 h-4 w-4" />
                    Events
                  </Button>
                  <Button
                    variant={activeTab === 'contacts' ? 'default' : 'ghost'}
                    className={`w-full justify-start ${activeTab === 'contacts' ? 'shadow-lg shadow-primary/40' : 'hover:bg-accent/50 hover:border-l-4 hover:border-primary hover:pl-3'}`}
                    onClick={() => navigate(route('/dashboard/contacts'))}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Contacts
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

            {/* Main Content - Scrollable */}
            <main className="col-span-9 overflow-y-auto">
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
                  <Route path="/issue" element={<IssueSchemaList />} />
                  <Route path="/issue/:schemaId" element={<IssueCredentialForm />} />
                  <Route path="/credentials" element={<Credentials />} />
                  <Route path="/credentials/new" element={<CredentialIssuer />} />
                  <Route path="/verify" element={<VerifyCredential />} />
                  <Route path="/sign" element={<Sign />} />
                  <Route path="/graph" element={<NetworkGraph />} />
                  <Route path="/graph/:said" element={<NetworkGraph />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/contacts/:identifier" element={<MyContact />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              )}
            </main>
          </div>
        </div>
      </div>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
