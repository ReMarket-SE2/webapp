'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/db/schema/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createCategory, updateCategory } from '@/lib/categories/actions';
import { toast } from 'sonner';

interface CategoryFormProps {
  categories: Category[];
  categoryToEdit?: Category;
  onClose: () => void;
}

export function CategoryForm({ categories, categoryToEdit, onClose }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [parentId, setParentId] = useState<string>(categoryToEdit?.parentId ? String(categoryToEdit.parentId) : 'none');
  const [nameError, setNameError] = useState('');
  const [disabledCategories, setDisabledCategories] = useState<Set<number>>(new Set());

  // Identify all descendant categories of the editing category to prevent circular references
  useEffect(() => {
    if (!categoryToEdit) return;

    const findAllDescendants = (categoryId: number): number[] => {
      // Find direct children
      const children = categories.filter(c => c.parentId === categoryId);
      
      // Base case: no children
      if (children.length === 0) return [];
      
      // Recursive case: include children and their descendants
      const directChildrenIds = children.map(c => c.id);
      const allDescendants = [...directChildrenIds];
      
      // Find descendants of each child
      for (const childId of directChildrenIds) {
        const childDescendants = findAllDescendants(childId);
        allDescendants.push(...childDescendants);
      }
      
      return allDescendants;
    };

    // Compute all descendants of the current category being edited
    const descendants = findAllDescendants(categoryToEdit.id);
    
    // Add the category itself to prevent self-reference
    descendants.push(categoryToEdit.id);
    
    // Set the disabled categories
    setDisabledCategories(new Set(descendants));
  }, [categoryToEdit, categories]);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else if (name.length > 100) {
      setNameError('Name must be 100 characters or less');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);

      const formData = {
        name,
        parentId: parentId && parentId !== 'none' ? parseInt(parentId, 10) : null,
      };

      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, formData);
        toast.success(`Category "${name}" updated successfully`);
      } else {
        await createCategory(formData);
        toast.success(`Category "${name}" created successfully`);
      }

      onClose();
    } catch (error) {
      toast.error(`Failed to ${categoryToEdit ? 'update' : 'create'} category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>{categoryToEdit ? 'Edit Category' : 'Create New Category'}</SheetTitle>
          <SheetDescription>
            {categoryToEdit
              ? 'Update the category information below'
              : 'Add a new product category to your marketplace'}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 px-4">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="Enter category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-2 px-4">
              <Label htmlFor="parentId">Parent Category (Optional)</Label>
              <Select
                value={parentId}
                onValueChange={(value: string) => setParentId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Top-level category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-level category)</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={String(category.id)}
                      disabled={disabledCategories.has(category.id)}
                    >
                      {category.name}
                      {disabledCategories.has(category.id) && categoryToEdit?.id !== category.id && " (Would create circular reference)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryToEdit && (
                <p className="text-xs text-muted-foreground">
                  A category cannot be assigned as a parent to any of its descendants to avoid circular references.
                </p>
              )}
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? categoryToEdit
                    ? 'Updating...'
                    : 'Creating...'
                  : categoryToEdit
                  ? 'Update Category'
                  : 'Create Category'}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}