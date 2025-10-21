import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Menu, X } from 'lucide-react';
import Button from '../components/ui/Button';
import HeroSection from '../components/landing/HeroSection';
import FeatureSection from '../components/landing/FeatureSection';
import LangflowSection from '../components/landing/LangflowSection';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Boxes className="mr-2 h-6 w-6 text-primary-600" />
            <span className="text-xl font-semibold text-gray-900">2LY</span>
          </div>
          
          <nav className="hidden items-center space-x-8 md:flex">
            {['Features', 'Integration', 'Pricing', 'Documentation'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
              >
                {item}
              </a>
            ))}
          </nav>
          
          <div className="hidden items-center space-x-4 md:flex">
            <Link to="/dashboard">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
          
          <button
            className="rounded-md p-2 text-gray-700 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {mobileMenuOpen && (
          <div className="border-b border-gray-200 bg-white md:hidden">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-4">
                {['Features', 'Integration', 'Pricing', 'Documentation'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
                  >
                    {item}
                  </a>
                ))}
                <div className="flex flex-col space-y-2 pt-4">
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
        <LangflowSection />
        
        {/* CTA Section */}
        <section className="bg-primary-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Transform Your Agent Ecosystem?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-100">
              Join innovative teams already using 2LY to manage their AI agent tools.
            </p>
            <Link to="/dashboard">
              <Button
                className="bg-white text-primary-600 hover:bg-primary-50"
                size="lg"
              >
                Try 2LY Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default LandingPage;