import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createNewsletterSubscriber } from '@/services/firestoreService'

const Footer = ({ variant = 'default' }: { variant?: 'default' | 'system' }) => {
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [subscriberMessage, setSubscriberMessage] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const isSystem = variant === 'system'
  const wrapperClasses = isSystem ? 'border-t border-slate-800 bg-slate-950 text-white' : 'bg-gray-900 text-white'
  const secondaryText = isSystem ? 'text-slate-300' : 'text-gray-300'
  const mutedText = isSystem ? 'text-slate-400' : 'text-gray-400'
  const accentText = isSystem ? 'text-cyan-300' : 'text-orange-500'
  const actionButtonClasses = isSystem
    ? 'border-slate-600 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
    : 'border-gray-600 bg-orange-500 text-white hover:bg-gray-800'
  const subscribeButtonClasses = isSystem ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-orange-500 hover:bg-orange-600'
  const inputClasses = isSystem
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
    : 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
  const quickLinks = isSystem
    ? [
        { label: 'System Home', href: '/system', type: 'route' },
        { label: 'AI Hub', href: '/system/ai-hub', type: 'route' },
        { label: 'Users', href: '/system/users', type: 'route' },
        { label: 'Invite Signup', href: '/system/invite', type: 'route' },
        { label: 'Main Website', href: '/', type: 'route' },
      ]
      : [
        { label: 'About Us', href: '/#about', type: 'anchor' },
        { label: 'Academics', href: '/#academics', type: 'anchor' },
        { label: 'Enrollment', href: '/enroll', type: 'route' },
        { label: 'Events', href: '/events', type: 'route' },
        { label: 'Board Members', href: '/board-members', type: 'route' },
        { label: 'Applicant Portal', href: '/applicant-portal', type: 'route' },
      ]

  const handleSubscribe = async () => {
    setSubscribing(true)
    setSubscriberMessage('')

    try {
      const result = await createNewsletterSubscriber({ email: subscriberEmail, source: 'footer' })
      setSubscriberMessage(
        result.duplicate
          ? 'This email is already subscribed. We refreshed your Homepage Footer updates.'
          : 'You are now subscribed to NSS updates from the Homepage Footer.'
      )
      setSubscriberEmail('')
    } catch (error) {
      setSubscriberMessage(error instanceof Error ? error.message : 'Failed to subscribe right now.')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer id="contact" className={wrapperClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSystem ? 'bg-cyan-400' : 'bg-orange-500'}`}>
                <img src="/images/nss-logo.jpg" alt="Nyagatare Secondary School logo" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nyagatare Secondary School</h3>
                <p className={mutedText}>{isSystem ? 'Secure system access and digital operations' : 'Excellence in STEM Education'}</p>
              </div>
            </div>
            <p className={`${secondaryText} mb-6 max-w-md`}>
              {isSystem
                ? 'The NSS system extends the school website into a protected digital workspace for administration, academics, invites, and operational intelligence.'
                : 'Empowering the next generation of innovators and leaders through comprehensive STEM education and character development.'}
            </p>
            <div className="flex space-x-4">
              <Button size="sm" variant="outline" className={actionButtonClasses}>
                <Facebook size={16} />
              </Button>
              <Button size="sm" variant="outline" className={actionButtonClasses}>
                <Twitter size={16} />
              </Button>
              <Button size="sm" variant="outline" className={actionButtonClasses}>
                <Instagram size={16} />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {item.type === 'route' ? (
                    <Link to={item.href} className={`${secondaryText} ${isSystem ? 'hover:text-cyan-300' : 'hover:text-orange-500'} transition-colors`}>
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className={`${secondaryText} ${isSystem ? 'hover:text-cyan-300' : 'hover:text-orange-500'} transition-colors`}>
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className={accentText} />
                <span className={`${secondaryText} text-sm`}>Nyagatare District, Rwanda</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className={accentText} />
                <span className={`${secondaryText} text-sm`}>+250 785 972 954</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className={accentText} />
                <span className={`${secondaryText} text-sm`}>nsheke@yahoo.com</span>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="outline" size="sm" className={actionButtonClasses} asChild>
                <Link to="/login">
                  <LogIn size={16} className="mr-2" />
                  Open NSS Digital System
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className={`mt-12 pt-8 ${isSystem ? 'border-t border-slate-800' : 'border-t border-gray-800'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
              <p className={mutedText}>
                {isSystem ? 'Stay aligned with secure school operations and platform updates.' : 'Subscribe to our newsletter for the latest news and events.'}
              </p>
            </div>
            <div className="w-full md:w-auto">
              <div className="flex w-full space-x-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className={inputClasses}
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
              />
              <Button className={subscribeButtonClasses} onClick={handleSubscribe} disabled={subscribing}>
                {subscribing ? 'Subscribing...' : 'Subscribe for Updates'}
              </Button>
              </div>
              {subscriberMessage ? <p className={`mt-2 text-sm ${mutedText}`}>{subscriberMessage}</p> : null}
            </div>
          </div>
        </div>

        <div className={`mt-8 pt-8 text-center ${isSystem ? 'border-t border-slate-800' : 'border-t border-gray-800'}`}>
          <h3 className="text-base font-semibold">
            <a href="https://tuyambaze-gilbert.vercel.app" className={`${secondaryText} ${isSystem ? 'hover:text-cyan-300' : 'hover:text-orange-500'}`}>
              Developed By Gilbert TUYAMBAZE
            </a>
          </h3>
          <p className={`mt-2 text-sm ${mutedText}`}>
            &copy; 2025 Nyagatare Secondary School. All rights reserved.
          </p>
        </div>
      </div>

    </footer>
  )
}

export default Footer
