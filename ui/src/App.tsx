import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-provider';
import { UserProvider } from './lib/user-provider';
import { AuthLayout } from './components/auth/AuthLayout';
import { UserCreation } from './components/auth/UserCreation';
import { UserSelection } from './components/auth/UserSelection';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <Routes>
            <Route path="/" element={<AuthLayout />} />
            <Route path="/create-user" element={<UserCreation />} />
            <Route path="/select-user" element={<UserSelection />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
          </Routes>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
