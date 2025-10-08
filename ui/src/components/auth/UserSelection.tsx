import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Toast, useToast } from '../ui/toast';
import { UserCircle, ArrowLeft } from 'lucide-react';
import { useUser } from '../../lib/user-provider';
import { route } from '../../config';

export function UserSelection() {
  const { users, setCurrentUser } = useUser();
  const { toast, showToast, hideToast } = useToast();
  const [selecting, setSelecting] = useState(false);
  const navigate = useNavigate();

  const handleSelectUser = async (user: typeof users[0]) => {
    setSelecting(true);
    try {
      await setCurrentUser(user);
      navigate(route('/'));
    } catch (error) {
      console.error('Failed to select user:', error);
      showToast('Failed to select user');
    } finally {
      setSelecting(false);
    }
  };

  const handleCreateNew = () => {
    navigate(route('/create-user'));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select User Profile</CardTitle>
          <CardDescription>Choose a profile to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="w-full justify-start h-auto p-4 hover:bg-accent/50 hover:border-primary hover:shadow-md transition-all"
              onClick={() => handleSelectUser(user)}
              disabled={selecting}
            >
              <UserCircle className="mr-3 h-8 w-8" />
              <div className="text-left">
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Button>
          ))}
          <div className="pt-4 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleCreateNew}
              disabled={selecting}
            >
              Create New Profile
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(route('/'))}
              disabled={selecting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </div>
  );
}
