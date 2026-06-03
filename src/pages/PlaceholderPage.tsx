import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="container min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--bg-secondary)', color: 'var(--purple-500)' }}
        >
          <Construction size={36} />
        </div>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          {description || 'This page is coming soon. We are building something amazing!'}
        </p>
        <Link to="/" className="btn btn-primary no-underline">
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
