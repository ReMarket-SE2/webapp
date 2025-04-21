'use client';

import { useState } from 'react';
import { Category } from '@/lib/db/schema/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { CategoryList } from './category-list';
import { CategoryForm } from './category-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteCategory } from '@/lib/categories/actions';
import { toast } from 'sonner';

interface CategoryManagementProps {
  categories: Category[];
}

// Define the recursive interface matching CategoryList's expectations
interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

export function CategoryManagement({ categories }: CategoryManagementProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Process the categories into a hierarchical structure with proper recursive typing
  const getCategoryHierarchy = (categories: Category[]): CategoryWithChildren[] => {
    // Map for efficient lookup with correct return type
    const categoryMap = new Map<number, CategoryWithChildren>();
    
    // First pass: create all category objects with empty children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { 
        ...category, 
        children: [] 
      });
    });
    
    // Second pass: build the hierarchy
    const rootCategories: CategoryWithChildren[] = [];
    
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId === null) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parentCategory = categoryMap.get(category.parentId);
        if (parentCategory) {
          parentCategory.children.push(categoryWithChildren);
        }
      }
    });
    
    return rootCategories;
  };

  const handleDelete = async (): Promise<void> => {
    if (!isDeletingCategory) return;
    
    try {
      setIsSubmitting(true);
      await deleteCategory(isDeletingCategory.id);
      toast.success(`Category "${isDeletingCategory.name}" deleted successfully`);
      setIsDeletingCategory(null);
    } catch (error) {
      toast.error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hierarchicalCategories = getCategoryHierarchy(categories);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl">Category Management</CardTitle>
          <CardDescription>Create, edit, and delete product categories</CardDescription>
        </div>
        <Button variant="default" onClick={() => setIsAddingCategory(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </CardHeader>
      
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">No categories have been created yet</p>
            <Button variant="outline" onClick={() => setIsAddingCategory(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create your first category
            </Button>
          </div>
        ) : (
          <CategoryList 
            categories={hierarchicalCategories}
            onEdit={setIsEditingCategory}
            onDelete={setIsDeletingCategory}
          />
        )}
      </CardContent>

      {/* Add Category Modal */}
      {isAddingCategory && (
        <CategoryForm
          categories={categories}
          onClose={() => setIsAddingCategory(false)}
        />
      )}

      {/* Edit Category Modal */}
      {isEditingCategory && (
        <CategoryForm
          categories={categories.filter(c => c.id !== isEditingCategory.id)}
          categoryToEdit={isEditingCategory}
          onClose={() => setIsEditingCategory(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!isDeletingCategory} onOpenChange={(open: boolean) => !open && setIsDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any subcategories and associated listings will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}