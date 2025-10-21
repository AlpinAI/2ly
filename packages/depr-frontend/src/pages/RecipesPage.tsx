import React, { useState } from 'react';
import { Search, Plus, CookingPot } from 'lucide-react';
import Button from '../components/ui/Button';
import RecipeCard from '../components/dashboard/RecipeCard';
import { mockRecipes } from '../utils/mockData';

const RecipesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = mockRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipes</h1>
          <p className="text-gray-500">Create and manage tool collections for your agents.</p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Recipe
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {filteredRecipes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
            <CookingPot className="h-6 w-6" />
          </div>
          <p className="mb-2 text-lg font-medium">No recipes found</p>
          <p className="mb-4 text-gray-500">Try adjusting your search or create a new recipe.</p>
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Recipe
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">What are Recipes?</h2>
        <p className="mb-4 text-gray-600">
          Recipes are collections of tools that can be applied to multiple agents at once. 
          They're useful for standardizing toolsets across similar types of agents or quickly 
          setting up new agents with a predefined set of tools.
        </p>
        <div className="rounded-md bg-white p-4">
          <h3 className="mb-2 font-medium">Tips for using recipes:</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            <li>Group related tools into logical collections</li>
            <li>Create recipes for different departments or functions</li>
            <li>Update recipes to automatically update all connected agents</li>
            <li>Share recipes with team members to standardize agent capabilities</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;