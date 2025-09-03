import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoginModal } from './LoginModal';

const Footer = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* School Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <img src="/images/nss-logo.jpg"/>
              </div>
              <div>
                <h3 className="text-xl font-bold">Nyagatare Secondary School</h3>
                <p className="text-gray-400">Excellence in STEM Education</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Empowering the next generation of innovators and leaders through comprehensive STEM education and character development.
            </p>
            <div className="flex space-x-4">
              <Button size="sm" variant="outline" className="border-gray-600 bg-orange-500 text-white hover:bg-gray-800">
                <Facebook size={16} />
              </Button>
              <Button size="sm" variant="outline" className="border-gray-600 bg-orange-500 text-white hover:bg-gray-800">
                <Twitter size={16} />
              </Button>
              <Button size="sm" variant="outline" className="border-gray-600 bg-orange-500 text-white hover:bg-gray-800">
                <Instagram size={16} />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="/#about" className="text-gray-300 hover:text-orange-500 transition-colors">About Us</a></li>
              <li><a href="/#academics" className="text-gray-300 hover:text-orange-500 transition-colors">Academics</a></li>
              <li><Link to="/enroll" className="text-gray-300 hover:text-orange-500 transition-colors">Enrollment</Link></li>
              <li><Link to="/events" className="text-gray-300 hover:text-orange-500 transition-colors">Events</Link></li>
              <li><Link to="/board-members" className="text-gray-300 hover:text-orange-500 transition-colors">Board Members</Link></li>
              <li><Link to="/student-portal" className="text-gray-300 hover:text-orange-500 transition-colors">Student Portal</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-orange-500" />
                <span className="text-gray-300 text-sm">Nyagatare District, Rwanda</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-orange-500" />
                <span className="text-gray-300 text-sm">+250 785 972 954</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-orange-500" />
                <span className="text-gray-300 text-sm">nsheke@yahoo.com</span>
              </div>
            </div>

            {/* Admin Login */}
            <div className="mt-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsLoginOpen(true)}
                className="border-gray-600 bg-orange-500 text-white hover:bg-gray-800"
              >
                <LogIn size={16} className="mr-2" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
              <p className="text-gray-400">Subscribe to our newsletter for the latest news and events.</p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <Input 
                placeholder="Enter your email" 
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button className="bg-orange-500 hover:bg-orange-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            <h3><a href="https://gilbert-tuyambaze.vercel.app" className="text-gray-300 hover:text-orange-500">Developed By Gilbert TUYAMBAZE</a></h3>
            © 2025 Nyagatare Secondary School. All rights reserved.
          </p>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen} 
      />
    </footer>
  );
};

export default Footer;
