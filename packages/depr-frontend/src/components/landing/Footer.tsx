import React from 'react';
import { Boxes, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center">
              <Boxes className="mr-2 h-6 w-6 text-primary-600" />
              <span className="text-xl font-semibold text-gray-900">2LY</span>
            </div>
            <p className="mb-4 text-gray-600">
              The complete solution for managing AI agent tools across your organization.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 transition-colors hover:text-gray-900">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-gray-900">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-gray-900">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-900">Product</h3>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Integration', 'Documentation', 'Roadmap'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-600 transition-colors hover:text-primary-600">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-900">Company</h3>
            <ul className="space-y-2">
              {['About', 'Team', 'Careers', 'Blog', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-600 transition-colors hover:text-primary-600">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-900">Legal</h3>
            <ul className="space-y-2">
              {['Terms', 'Privacy', 'Cookies', 'Licenses', 'Settings'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-600 transition-colors hover:text-primary-600">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-200 pt-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} 2LY. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;