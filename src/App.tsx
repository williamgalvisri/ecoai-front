import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Inbox from './pages/Inbox';
import CalendarPage from './pages/Calendar';
import ContactsPage from './pages/Contacts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Orders from './pages/Orders';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { NotificationProvider } from './context/NotificationContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/inbox" replace />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="orders" element={<Orders />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  )
}

export default App
