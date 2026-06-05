import { useLocation } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  useScrollReveal(pathname);
  return <>{children}</>;
}
