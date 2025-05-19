'use client';

import { Category } from '@/lib/db/schema/categories';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

interface CategoryListProps {
  categories: CategoryWithChildren[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  depth?: number;
}

const paddingMap: Record<number, string> = {
  0: 'pl-0',
  1: 'pl-6',
  2: 'pl-12',
  3: 'pl-16',
  4: 'pl-20',
  5: 'pl-24',
  6: 'pl-28',
};

export function CategoryList({ categories, onEdit, onDelete, depth = 0 }: CategoryListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

  const paddingClass = paddingMap[depth] ?? 'pl-0'

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="space-y-1" data-testid="category-list-container">
      {categories.map((category) => (
        <div key={category.id} className="w-full">
          <div 
            className={`flex items-center justify-between py-2 rounded-md hover:bg-muted/50 transition-colors ${paddingClass}`}
          >
            <div className="flex items-center gap-2">
              {category.children.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleExpand(category.id)}
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" /> // Spacer
              )}
              <span className="font-medium">{category.name}</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(category)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit {category.name}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete {category.name}</span>
              </Button>
            </div>
          </div>
          
          {/* Recursively render children if expanded */}
          {expandedCategories[category.id] && category.children.length > 0 && (
            <CategoryList
              categories={category.children}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}