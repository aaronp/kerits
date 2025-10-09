import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-provider';
import { UserProvider } from './lib/user-provider';
import { AccountProvider } from './lib/account-provider';
import { UserCreation } from './components/auth/UserCreation';
import { UserSelection } from './components/auth/UserSelection';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/toaster';
import { BASE_PATH } from './config';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <UserProvider>
          <AccountProvider>
            <Routes>
              <Route path={`${BASE_PATH}/create-user`} element={<UserCreation />} />
              <Route path={`${BASE_PATH}/select-user`} element={<UserSelection />} />
              <Route path={`${BASE_PATH}/*`} element={<Dashboard />} />
            </Routes>
            <Toaster />
          </AccountProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
