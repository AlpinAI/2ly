import React from 'react';
import { motion } from 'framer-motion';
import { CookingPot, Plus, Copy, Trash } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { Recipe } from '../../types';
import { cn, formatDate } from '../../utils/helpers';
import { mockTools } from '../../utils/mockData';

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, className }) => {
  const recipeTools = recipe.tools.map(
    toolId => mockTools.find(tool => tool.id === toolId)
  ).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('h-full', className)}>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b border-gray-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
              <CookingPot className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-base font-semibold">{recipe.name}</h3>
              <p className="truncate text-sm text-gray-500">{recipeTools.length} tools</p>
            </div>
          </div>
          
          <div className="p-4">
            <p className="mb-3 text-sm text-gray-600">{recipe.description}</p>
            
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-gray-50 p-2">
                <span className="block text-gray-500">Created</span>
                <span className="font-medium">{formatDate(recipe.createdAt)}</span>
              </div>
              <div className="rounded-md bg-gray-50 p-2">
                <span className="block text-gray-500">Last Used</span>
                <span className="font-medium">{recipe.lastUsed ? formatDate(recipe.lastUsed) : 'Never'}</span>
              </div>
            </div>
            
            <div className="mt-3">
              <h4 className="mb-2 text-xs font-medium text-gray-700">Tools in this recipe:</h4>
              <div className="max-h-28 overflow-y-auto rounded-md border border-gray-200">
                {recipeTools.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {recipeTools.map((tool) => (
                      tool && (
                        <li key={tool.id} className="flex items-center p-2 text-sm">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          <span className="ml-2">{tool.name}</span>
                        </li>
                      )
                    ))}
                  </ul>
                ) : (
                  <p className="p-3 text-center text-sm text-gray-500">No tools in this recipe</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t border-gray-100 p-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy className="h-4 w-4" />}
              >
                Clone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash className="h-4 w-4" />}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Apply to Agent
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default RecipeCard;