import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpenText, ChevronDown, Compass, GraduationCap, LayoutDashboard, Menu, Newspaper, Phone, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DonationModal } from './DonationModal';
import { useAuth } from '@/contexts/AuthContext';
import { getHeaderSystemNav } from '@/loginpage/lib/systemNavigation';

const Header = ({ variant = 'default' }: { variant?: 'default' | 'system' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const location = useLocation();
  const { accessProfile } = useAuth();
  const systemNavItems = [
    ...getHeaderSystemNav(accessProfile).map((item) => ({
      name: item.label,
      href: item.to,
      type: 'route' as const,
      icon: item.icon,
    })),
    { name: 'Website', href: '/', type: 'route' as const, icon: Compass },
  ];
  const primarySystemNavItems = systemNavItems;
  const overflowSystemNavItems: typeof systemNavItems = [];
  const publicPrimaryNavItems = [
    { name: 'About', href: '/#about', type: 'section' as const, icon: ShieldCheck },
    { name: 'Academics', href: '/#academics', type: 'section' as const, icon: GraduationCap },
    { name: 'Admissions', href: '/enroll', type: 'route' as const, icon: Sparkles },
    { name: 'NSS System', href: '/login', type: 'route' as const, icon: LayoutDashboard },
  ];
  const publicOverflowNavItems = [
    { name: 'Campus Life', href: '/#resources', type: 'section' as const, icon: Compass },
    { name: 'Governance', href: '/board-members', type: 'route' as const, icon: ShieldCheck },
    { name: 'Events', href: '/events', type: 'route' as const, icon: Newspaper },
    { name: 'Blog', href: '/blog', type: 'route' as const, icon: BookOpenText },
    { name: 'Contact', href: '/#contact', type: 'section' as const, icon: Phone },
  ];

  const navItems =
    variant === 'system'
      ? systemNavItems
      : [...publicPrimaryNavItems, ...publicOverflowNavItems];

  const isSystem = variant === 'system';
  const headerClasses = isSystem
    ? 'sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 text-white shadow-lg shadow-slate-950/30 backdrop-blur'
    : 'fixed top-0 z-50 w-full bg-white shadow-sm';
  const brandAccentClasses = isSystem ? 'text-cyan-200' : 'text-gray-500';
  const brandTitleClasses = isSystem ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900';
  const navLinkClasses = isSystem
    ? 'inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-200 hover:border-cyan-400/30 hover:text-cyan-200 font-medium text-sm transition-colors'
    : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-gray-700 hover:border-orange-300 hover:text-orange-600 font-medium text-sm transition-colors';
  const mobileButtonClasses = isSystem
    ? 'lg:hidden p-2 rounded-md text-slate-200 hover:text-cyan-200'
    : 'lg:hidden p-2 rounded-md text-gray-700 hover:text-orange-600';
  const utilityButtonClasses = isSystem
    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-6 py-2 font-semibold tracking-wide'
    : 'bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 font-semibold tracking-wide';
  const utilityLabel = isSystem ? 'Main Site' : 'Donate';

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
                <div className={`text-xs uppercase tracking-wide ${brandAccentClasses}`}>{isSystem ? 'NSS DIGITAL SYSTEM' : 'NSS Rwanda'}</div>
                <div className={brandTitleClasses}>NYAGATARE SECONDARY SCHOOL</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-end gap-3">
            {(isSystem ? primarySystemNavItems : publicPrimaryNavItems).map((item) => (
              item.type === 'route' ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={navLinkClasses}
                >
                  {'icon' in item && item.icon ? <item.icon className="h-4 w-4" /> : null}
                  {item.name}
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className={navLinkClasses}
                >
                  {'icon' in item && item.icon ? <item.icon className="h-4 w-4" /> : null}
                  {item.name}
                </button>
              )
            ))}
            {(isSystem ? overflowSystemNavItems.length > 0 : publicOverflowNavItems.length > 0) ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={navLinkClasses}>
                    <ChevronDown className="h-4 w-4" />
                    {isSystem ? 'More' : 'Explore'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={isSystem ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}>
                  {(isSystem ? overflowSystemNavItems : publicOverflowNavItems).map((item) => (
                    <DropdownMenuItem key={item.name} asChild className={isSystem ? 'focus:bg-slate-900 focus:text-white' : 'focus:bg-orange-50 focus:text-orange-700'}>
                      {item.type === 'route' ? (
                        <Link to={item.href} className="flex items-center gap-2">
                          {'icon' in item && item.icon ? <item.icon className="h-4 w-4" /> : null}
                          {item.name}
                        </Link>
                      ) : (
                        <button onClick={() => handleNavClick(item)} className="flex w-full items-center gap-2">
                          {'icon' in item && item.icon ? <item.icon className="h-4 w-4" /> : null}
                          {item.name}
                        </button>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
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
