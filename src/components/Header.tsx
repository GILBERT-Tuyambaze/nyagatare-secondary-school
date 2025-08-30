import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DonationModal } from './DonationModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'ABOUT', href: '/#about', type: 'section' },
    { name: 'INSTRUCTION', href: '/#academics', type: 'section' },
    { name: 'RESOURCES', href: '/#resources', type: 'section' },
    { name: 'BOARD MEMBERS', href: '/board-members', type: 'route' },
    { name: 'ENROLL', href: '/enroll', type: 'route' },
    { name: 'EVENTS', href: '/events', type: 'route' },
    { name: 'CONTACT', href: '/#contact', type: 'section' },
  ];

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
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
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
                <div className="text-xs text-gray-500 uppercase tracking-wide">Nss</div>
                <div className="text-lg font-semibold text-gray-900">NYAGATARE SECONDARY SCHOOL</div>
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
                  className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors"
                >
                  {item.name}
                </button>
              )
            ))}
            <Button 
              onClick={() => setIsDonationOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 font-semibold tracking-wide"
            >
              DONATE
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-orange-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                item.type === 'route' ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item)}
                    className="text-gray-700 hover:text-orange-600 font-medium text-sm tracking-wide transition-colors text-left"
                  >
                    {item.name}
                  </button>
                )
              ))}
              <Button 
                onClick={() => {
                  setIsDonationOpen(true);
                  setIsMenuOpen(false);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white w-fit px-6 py-2 font-semibold tracking-wide"
              >
                DONATE
              </Button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Donation Modal */}
      <DonationModal 
        open={isDonationOpen} 
        onOpenChange={setIsDonationOpen} 
      />
    </header>
  );
};

export default Header;