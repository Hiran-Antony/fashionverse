import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import LoginPromptModal from '../auth/LoginPromptModal';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1" style={{ marginTop: 'var(--nav-height)' }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      {/* Global modal — shown whenever a guest tries a protected action */}
      <LoginPromptModal />
    </div>
  );
}
