import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Toast, useToast } from './ui/toast';
import { useStore } from '../store/useStore';
import { getDSL } from '../lib/dsl';
import { Network, FileText, Award, Moon, Sun, LogOut, UserCircle, User, Pencil, Users, Share2, ChevronRight, ChevronLeft, Home } from 'lucide-react';
import keritsLogo from '/kerits.jpg';
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
import { Contacts } from './Contacts';
import { MyContact } from './MyContact';
import { Explorer } from './explorer/Explorer';
import { AuthLayout } from './auth/AuthLayout';
import { useTheme } from '../lib/theme-provider';
import { useUser } from '../lib/user-provider';
import { route } from '../config';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identities, schemas, loading, init, setUserId } = useStore();
  const { theme, setTheme } = useTheme();
  const { currentUser, logout } = useUser();
  const { toast, showToast, hideToast } = useToast();
  const [bannerColor, setBannerColor] = useState<string>('#3b82f6');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(false);

  // Set userId in store when currentUser changes
  useEffect(() => {
    setUserId(currentUser?.id || null);
    if (currentUser) {
      init();
    }
  }, [currentUser, setUserId, init]);

  // Check for accounts in the new DSL system
  useEffect(() => {
    async function checkAccounts() {
      if (!currentUser) {
        setHasAccounts(false);
        return;
      }

      try {
        const dsl = await getDSL(currentUser.id);
        const accountNames = await dsl.accountNames();
        setHasAccounts(accountNames.length > 0);
      } catch (error) {
        console.error('Failed to check for accounts:', error);
        setHasAccounts(false);
      }
    }
    checkAccounts();
  }, [currentUser]);

  useEffect(() => {
    // Redirect to root if no user is logged in
    if (!currentUser) {
      navigate(route('/'), { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Load banner color from localStorage for current user
    if (currentUser) {
      const savedColor = localStorage.getItem(`kerits-banner-color-${currentUser.id}`);
      if (savedColor) {
        setBannerColor(savedColor);
      } else {
        setBannerColor('#3b82f6'); // Reset to default if no color saved
      }
    }

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (currentUser && e.key === `kerits-banner-color-${currentUser.id}` && e.newValue) {
        setBannerColor(e.newValue);
      }
    };

    // Listen for custom event for same-window updates
    const handleColorUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; color: string }>;
      if (currentUser && customEvent.detail.userId === currentUser.id) {
        setBannerColor(customEvent.detail.color);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kerits-color-changed', handleColorUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kerits-color-changed', handleColorUpdate);
    };
  }, [currentUser]);

  const getActiveTab = () => {
    const path = location.pathname;
    const basePath = route('/');
    if (path === basePath || path === `${basePath}/`) return 'home';
    if (path.includes(route('/schemas'))) return 'schemas';
    if (path.includes(route('/issue'))) return 'issue';
    if (path.includes(route('/credentials'))) return 'credentials';
    if (path.includes(route('/verify'))) return 'verify';
    if (path.includes(route('/sign'))) return 'sign';
    if (path.includes(route('/graph'))) return 'graph';
    if (path.includes(route('/contacts'))) return 'contacts';
    if (path.includes(route('/profile'))) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleShareKEL = async () => {
    try {
      let kelText = '';

      if (hasAccounts) {
        // Use DSL to export account KEL
        const dsl = await getDSL(currentUser?.id);
        const accountNames = await dsl.accountNames();
        if (accountNames.length === 0) {
          showToast('No account to share');
          return;
        }
        const accountDsl = await dsl.account(accountNames[0]);
        if (!accountDsl) {
          showToast('Failed to load account');
          return;
        }
        const exportDsl = await accountDsl.export();
        const cesr = exportDsl.toCESR();
        kelText = new TextDecoder().decode(cesr);
      } else if (identities.length > 0) {
        // Use old system
        const identity = identities[0];
        kelText = JSON.stringify(identity.kel, null, 2);
      } else {
        showToast('No identity to share');
        return;
      }

      // Try clipboard first, with fallback to download
      try {
        await navigator.clipboard.writeText(kelText);
        showToast('Account KEL copied to clipboard (CESR format)');
      } catch (clipboardError) {
        console.warn('Clipboard write failed, downloading instead:', clipboardError);

        // Fallback: Download as file
        const blob = new Blob([kelText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `account-kel-${Date.now()}.cesr`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('KEL downloaded (clipboard not available)');
      }
    } catch (error) {
      console.error('Failed to share KEL:', error);
      showToast(`Failed to share: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    return <AuthLayout />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Fixed */}
      <header className="border-b flex-shrink-0" style={{ backgroundColor: bannerColor }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={keritsLogo}
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
              <div className="flex items-center gap-2">
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
                    <DropdownMenuItem onClick={() => navigate(route('/profile'))}>
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
              onClick={() => navigate(route('/'))}
              title="Home"
            >
              <Home className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Home</span>}
            </Button>
            <Button
              variant={activeTab === 'contacts' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'contacts' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/contacts'))}
              title="Contacts"
            >
              <Users className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Contacts</span>}
            </Button>
            <Button
              variant={activeTab === 'schemas' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'schemas' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/schemas'))}
              title="Schemas"
            >
              <FileText className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Schemas</span>}
            </Button>
            <Button
              variant={activeTab === 'sign' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'sign' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/sign'))}
              title="Sign"
            >
              <Pencil className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Sign</span>}
            </Button>
            <Button
              variant={activeTab === 'graph' ? 'default' : 'ghost'}
              size={sidebarExpanded ? 'default' : 'icon'}
              className={`${sidebarExpanded ? 'mx-2 justify-start' : 'mx-auto'} ${activeTab === 'graph' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => navigate(route('/graph'))}
              title="Events"
            >
              <Network className={`h-5 w-5 ${sidebarExpanded ? 'mr-2' : ''}`} />
              {sidebarExpanded && <span>Events</span>}
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
          <div className="h-full">
            <main className="h-full overflow-y-auto">
              {loading ? (
                <Card className="container mx-auto px-4 py-6">
                  <CardContent className="text-center py-12 text-muted-foreground">
                    Loading...
                  </CardContent>
                </Card>
              ) : (
                <Routes>
                  {/* More specific routes first - explorer with account alias */}
                  <Route path="/explorer/:accountAlias/*" element={<Explorer />} />
                  <Route path="/schemas" element={<div className="container mx-auto px-4 py-6"><Schemas /></div>} />
                  <Route path="/schemas/new" element={<div className="container mx-auto px-4 py-6"><SchemaCreator /></div>} />
                  <Route path="/credentials" element={<div className="container mx-auto px-4 py-6"><Credentials /></div>} />
                  <Route path="/credentials/new" element={<div className="container mx-auto px-4 py-6"><CredentialIssuer /></div>} />
                  <Route path="/verify" element={<div className="container mx-auto px-4 py-6"><VerifyCredential /></div>} />
                  <Route path="/sign" element={<div className="container mx-auto px-4 py-6"><Sign /></div>} />
                  <Route path="/graph" element={<div className="container mx-auto px-4 py-6"><NetworkGraph /></div>} />
                  <Route path="/graph/:said" element={<div className="container mx-auto px-4 py-6"><NetworkGraph /></div>} />
                  <Route path="/contacts" element={<div className="container mx-auto px-4 py-6"><Contacts /></div>} />
                  <Route path="/contacts/:identifier" element={<div className="container mx-auto px-4 py-6"><MyContact /></div>} />
                  <Route path="/profile" element={<div className="container mx-auto px-4 py-6"><Profile /></div>} />
                  {/* Default route - Explorer without account alias (uses current account) */}
                  <Route path="/" element={<Explorer />} />
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
