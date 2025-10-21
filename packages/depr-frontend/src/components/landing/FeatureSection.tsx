import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Wrench, Puzzle, Activity, Zap } from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <motion.div 
      className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4 rounded-full bg-primary-100 p-3 text-primary-600">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Agent Visibility",
      description: "Get complete visibility into all your AI agents across your organization's landscape."
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      title: "Tool Management",
      description: "Add, edit, and remove tools from your agents with ease. Configure everything in one place."
    },
    {
      icon: <Puzzle className="h-6 w-6" />,
      title: "Integration Ready",
      description: "Seamlessly connects with Langflow to extend your existing agent workflows."
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Usage Monitoring",
      description: "Track how tools are being used across agents with comprehensive analytics."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Custom Tools",
      description: "Build your own tools with JavaScript or Python to address your specific needs."
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Why Choose 2LY?</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Take control of your agent ecosystem with powerful tools designed for IT innovation teams.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;