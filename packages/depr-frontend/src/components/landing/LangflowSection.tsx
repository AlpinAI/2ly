import React from 'react';
import { motion } from 'framer-motion';
import { Link, Check } from 'lucide-react';
import Button from '../ui/Button';

const LangflowSection: React.FC = () => {
  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-10 lg:flex-row">
          <motion.div 
            className="relative w-full max-w-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative z-10 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
              <img 
                src="https://images.pexels.com/photos/8439097/pexels-photo-8439097.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Langflow Integration" 
                className="h-auto w-full rounded-lg"
              />
            </div>
            <div 
              className="absolute -bottom-4 -left-4 z-0 h-40 w-40 rounded-full bg-primary-200 opacity-70 blur-3xl"
              aria-hidden="true"
            ></div>
          </motion.div>
          
          <motion.div 
            className="max-w-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
              Seamless Integration with <span className="text-primary-600">Langflow</span>
            </h2>
            <p className="mb-6 text-lg text-gray-600">
              Connect your existing Langflow workflows in minutes. 2LY automatically discovers your agents 
              and makes it easy to manage all their tools in one place.
            </p>
            
            <ul className="mb-8 space-y-4">
              {[
                "One-click connection to your Langflow instance",
                "Automatic agent discovery across workflows",
                "Deploy tools to any agent with minimal configuration",
                "Monitor tool usage directly within your workflows"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            
            <Button
              leftIcon={<Link className="h-5 w-5" />}
            >
              Connect to Langflow
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LangflowSection;