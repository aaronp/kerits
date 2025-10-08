import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-provider';
import { UserProvider } from './lib/user-provider';
import { AccountProvider } from './lib/account-provider';
import { AuthLayout } from './components/auth/AuthLayout';
import { UserCreation } from './components/auth/UserCreation';
import { UserSelection } from './components/auth/UserSelection';
import { Dashboard } from './components/Dashboard';
import { BASE_PATH } from './config';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <AccountProvider>
            <Routes>
              <Route path={BASE_PATH} element={<AuthLayout />} />
              <Route path={`${BASE_PATH}/create-user`} element={<UserCreation />} />
              <Route path={`${BASE_PATH}/select-user`} element={<UserSelection />} />
              <Route path={`${BASE_PATH}/dashboard/*`} element={<Dashboard />} />
            </Routes>
          </AccountProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
