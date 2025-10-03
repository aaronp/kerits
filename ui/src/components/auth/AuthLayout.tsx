import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { UserPlus, Users } from 'lucide-react';
import { useUser } from '../../lib/user-provider';

export function AuthLayout() {
  const { currentUser, users, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, go to dashboard
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't show welcome screen if already logged in
  if (currentUser) {
    return null;
  }

  const hasUsers = users.length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={`${import.meta.env.BASE_URL}kerits.jpg`} alt="KERI" className="h-20 w-20 rounded-lg object-cover" />
          </div>
          <CardTitle className="text-2xl">Welcome to KERITS</CardTitle>
          <CardDescription>
            Key Event Receipt Infrastructure (TypeScript)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasUsers && (
            <Button
              variant="default"
              className="w-full h-auto p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              onClick={() => navigate('/select-user')}
            >
              <Users className="mr-3 h-6 w-6" />
              <div className="text-left flex-1">
                <div className="font-semibold">Select User</div>
                <div className="text-xs opacity-90">
                  {users.length} {users.length === 1 ? 'profile' : 'profiles'} available
                </div>
              </div>
            </Button>
          )}
          <Button
            variant={hasUsers ? 'outline' : 'default'}
            className={`w-full h-auto p-4 transition-all ${hasUsers ? 'hover:bg-accent/50 hover:border-primary' : 'shadow-lg hover:shadow-xl hover:scale-105'}`}
            onClick={() => navigate('/create-user')}
          >
            <UserPlus className="mr-3 h-6 w-6" />
            <div className="text-left flex-1">
              <div className="font-semibold">Create New User</div>
              <div className="text-xs opacity-90">
                Set up a new profile with identity
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
