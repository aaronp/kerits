import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Toast, useToast } from './ui/toast';
import { useStore } from '../store/useStore';
import { Network, FileText, Award, Moon, Sun, LogOut, UserCircle, User, Pencil, Users, Share2, ChevronRight, ChevronLeft, Home } from 'lucide-react';
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
import { Explorer } from './explorer/Explorer';
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
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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
    if (path === '/dashboard' || path === '/dashboard/') return 'home';
    if (path.includes('/dashboard/schemas')) return 'schemas';
    if (path.includes('/dashboard/issue')) return 'issue';
    if (path.includes('/dashboard/credentials')) return 'credentials';
    if (path.includes('/dashboard/verify')) return 'verify';
    if (path.includes('/dashboard/sign')) return 'sign';
    if (path.includes('/dashboard/graph')) return 'graph';
    if (path.includes('/dashboard/contacts')) return 'contacts';
    if (path.includes('/dashboard/profile')) return 'profile';
    return 'home';
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
              <img
                src='/kerits/kerits.jpg'
                alt="KERI"
                className="h-12 w-12 rounded-md object-cover "
                title="Key Event Receipt Infrastructure (TypeScript)"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">KERITS</h1>
                <p className="text-sm text-white/80">
                  Secure Data Ownership
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

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Expandable/collapsible sidebar */}
        <aside className={`flex flex-col border-r bg-card transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-64' : 'w-16'}`}>
          {/* Toggle button at top */}
          <div className="flex items-center justify-end p-2 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex-1 flex flex-col py-4 space-y-2 overflow-hidden">
            <Button
              variant={activeTab === 'home' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'home' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/dashboard'))}
              title="Home"
            >
              <Home className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Home</span>}
            </Button>
            {schemas.length > 0 && (
              <Button
                variant={activeTab === 'issue' ? 'default' : 'ghost'}
                size={sidebarExpanded ? 'default' : 'icon'}
                className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'issue' ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => navigate(route('/dashboard/issue'))}
                title="Issue"
              >
                <Award className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
                {sidebarExpanded && <span>Issue</span>}
              </Button>
            )}
            <Button
              variant={activeTab === 'schemas' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'schemas' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/dashboard/schemas'))}
              title="Schemas"
            >
              <FileText className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Schemas</span>}
            </Button>
            <Button
              variant={activeTab === 'credentials' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'credentials' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/dashboard/credentials'))}
              title="Credentials"
            >
              <Award className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Credentials</span>}
            </Button>
            <Button
              variant={activeTab === 'sign' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'sign' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/dashboard/sign'))}
              title="Sign"
            >
              <Pencil className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Sign</span>}
            </Button>
            <Button
              variant={activeTab === 'graph' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'graph' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/dashboard/graph'))}
              title="Events"
            >
              <Network className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Events</span>}
            </Button>
            <Button
              variant={activeTab === 'contacts' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'contacts' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/dashboard/contacts'))}
              title="Contacts"
            >
              <Users className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Contacts</span>}
            </Button>
          </div>

          {/* Theme toggle at bottom */}
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'w-full justify-start' : 'mx-auto'}`}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
                  {sidebarExpanded && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
                  {sidebarExpanded && <span>Dark Mode</span>}
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="container mx-auto px-4 py-6 h-full">
            <main className="h-full overflow-y-auto">
              {loading ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    Loading...
                  </CardContent>
                </Card>
              ) : (
                <Routes>
                  <Route path="/" element={<Explorer />} />
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
