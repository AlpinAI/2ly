import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center lg:flex-row lg:justify-between">
          <motion.div 
            className="mb-10 max-w-2xl lg:mb-0 lg:mr-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              Manage Your AI <span className="text-primary-600">Tools</span> Across All Agents
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              2LY gives you complete visibility and control over your agent ecosystem. 
              Connect, configure, and monitor tools across all your AI workflows.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="relative w-full max-w-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative z-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <img 
                src="https://images.pexels.com/photos/7989741/pexels-photo-7989741.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="2LY Dashboard Preview" 
                className="h-auto w-full"
              />
            </div>
            <div 
              className="absolute -bottom-6 -right-6 z-0 h-64 w-64 rounded-full bg-secondary-200 opacity-70 blur-3xl"
              aria-hidden="true"
            ></div>
            <div 
              className="absolute -left-4 -top-4 z-0 h-40 w-40 rounded-full bg-primary-200 opacity-70 blur-3xl"
              aria-hidden="true"
            ></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;