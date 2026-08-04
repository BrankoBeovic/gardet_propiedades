import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetail from './pages/PropertyDetail';
import SobreNosotros from './pages/SobreNosotros';
import Contacto from './pages/Contacto';
import { peekPendingScroll, restoreScrollY } from './utils/scrollMemory';

const RETURN_KEY = 'gardet:returnScroll';
const PENDING_KEY = 'gardet:pendingScroll';

function readReturnScrollForPath(pathname) {
  try {
    const pending = peekPendingScroll();
    if (pending != null && pending > 0) return pending;

    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.y !== 'number' || data.y <= 0) return null;

    const savedPath = String(data.path || '').split('?')[0];
    if (savedPath === pathname) return data.y;
  } catch {
    // ignore
  }
  return null;
}

function clearScrollMemorySoon() {
  const t = setTimeout(() => {
    try {
      sessionStorage.removeItem(PENDING_KEY);
      sessionStorage.removeItem(RETURN_KEY);
    } catch {
      // ignore
    }
  }, 1500);
  return () => clearTimeout(t);
}

// Forward nav → top. Return from property detail → restore remembered scroll.
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const y = readReturnScrollForPath(pathname);
    if (y != null && y > 0) {
      const stopRestore = restoreScrollY(y);
      const stopClear = clearScrollMemorySoon();
      return () => {
        stopRestore();
        stopClear();
      };
    }

    if (navigationType === 'POP') {
      return undefined;
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, navigationType]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/propiedades" element={<PropertiesPage />} />
            <Route path="/venta" element={<PropertiesPage operationType="Venta" />} />
            <Route path="/arriendo" element={<PropertiesPage operationType="Arriendo" />} />
            <Route path="/propiedad/:id" element={<PropertyDetail />} />
            <Route path="/sobre-nosotros" element={<SobreNosotros />} />
            <Route path="/quienes-somos" element={<SobreNosotros />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
