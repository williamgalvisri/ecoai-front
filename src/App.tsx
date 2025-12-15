import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Inbox from './pages/Inbox';
import CalendarPage from './pages/Calendar';
import ContactsPage from './pages/Contacts';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/inbox" replace />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
