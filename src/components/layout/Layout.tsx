import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import LoginPromptModal from '../auth/LoginPromptModal';
import MicroInteractions from '../MicroInteractions';
import ScrollRevealProvider from '../ScrollRevealProvider';

export default function Layout() {
  return (
    <ScrollRevealProvider>
    <div className="flex flex-col min-h-screen">
      <MicroInteractions />
      <Navbar />
      <main className="flex-1" style={{ marginTop: 'var(--nav-height)' }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      {/* Global modal — shown whenever a guest tries a protected action */}
      <LoginPromptModal />
    </div>
    </ScrollRevealProvider>
  );
}
