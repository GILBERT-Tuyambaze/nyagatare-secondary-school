import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DonationModal } from './DonationModal';

const Header = ({ variant = 'default' }: { variant?: 'default' | 'system' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const location = useLocation();

  const navItems =
    variant === 'system'
      ? [
          { name: 'SYSTEM HOME', href: '/system', type: 'route' },
          { name: 'USERS', href: '/system/users', type: 'route' },
          { name: 'AI HUB', href: '/system/ai-hub', type: 'route' },
          { name: 'INVITE', href: '/system/invite', type: 'route' },
          { name: 'WEBSITE', href: '/', type: 'route' },
          { name: 'CONTACT', href: '/#contact', type: 'section' },
        ]
      : [
          { name: 'ABOUT', href: '/#about', type: 'section' },
          { name: 'INSTRUCTION', href: '/#academics', type: 'section' },
          { name: 'RESOURCES', href: '/#resources', type: 'section' },
          { name: 'BOARD MEMBERS', href: '/board-members', type: 'route' },
          { name: 'ENROLL', href: '/enroll', type: 'route' },
          { name: 'EVENTS', href: '/events', type: 'route' },
          { name: 'SYSTEM', href: '/login', type: 'route' },
          { name: 'CONTACT', href: '/#contact', type: 'section' },
        ];

  const isSystem = variant === 'system';
  const headerClasses = isSystem
    ? 'sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 text-white shadow-lg shadow-slate-950/30 backdrop-blur'
    : 'fixed top-0 z-50 w-full bg-white shadow-sm';
  const brandAccentClasses = isSystem ? 'text-cyan-200' : 'text-gray-500';
  const brandTitleClasses = isSystem ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900';
  const navLinkClasses = isSystem
    ? 'text-slate-200 hover:text-cyan-200 font-medium text-sm tracking-wide transition-colors'
    : 'text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors';
  const mobileButtonClasses = isSystem
    ? 'lg:hidden p-2 rounded-md text-slate-200 hover:text-cyan-200'
    : 'lg:hidden p-2 rounded-md text-gray-700 hover:text-orange-600';
  const utilityButtonClasses = isSystem
    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-6 py-2 font-semibold tracking-wide'
    : 'bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 font-semibold tracking-wide';
  const utilityLabel = isSystem ? 'MAIN SITE' : 'DONATE';

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      // Navigate to home first, then scroll
      window.location.href = `/#${sectionId}`;
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.type === 'section') {
      const sectionId = item.href.split('#')[1];
      scrollToSection(sectionId);
    } else {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and School Name */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              {/* School Crest/Logo */}
              <div className="w-12 h-full flex items-center justify-center">
                <img src="/images/nss-logo.jpg"/>
              </div>
              <div>
                <div className={`text-xs uppercase tracking-wide ${brandAccentClasses}`}>{isSystem ? 'NSS SYSTEM' : 'Nss'}</div>
                <div className={brandTitleClasses}>NYAGATARE SECONDARY SCHOOL</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              item.type === 'route' ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={navLinkClasses}
                >
                  {item.name}
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className={navLinkClasses}
                >
                  {item.name}
                </button>
              )
            ))}
            <Button 
              onClick={() => (isSystem ? (window.location.href = '/') : setIsDonationOpen(true))}
              className={utilityButtonClasses}
            >
              {utilityLabel}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={mobileButtonClasses}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`lg:hidden py-4 border-t ${isSystem ? 'border-slate-800' : ''}`}>
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                item.type === 'route' ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={navLinkClasses}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item)}
                    className={`${navLinkClasses} text-left`}
                  >
                    {item.name}
                  </button>
                )
              ))}
              <Button 
                onClick={() => {
                  if (isSystem) {
                    window.location.href = '/';
                  } else {
                    setIsDonationOpen(true);
                  }
                  setIsMenuOpen(false);
                }}
                className={`w-fit px-6 py-2 font-semibold tracking-wide ${utilityButtonClasses}`}
              >
                {utilityLabel}
              </Button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Donation Modal */}
      {!isSystem ? <DonationModal open={isDonationOpen} onOpenChange={setIsDonationOpen} /> : null}
    </header>
  );
};

export default Header;
