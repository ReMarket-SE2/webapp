import {
  getCategories,
  getTopLevelCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryPath,
} from '@/lib/categories/actions';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema/categories';
import { listings } from '@/lib/db/schema/listings';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, isNull } from 'drizzle-orm';
import pg from 'postgres';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  authOptions: {}, // Mock authOptions if it's directly used, otherwise not needed here
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockDbQueryCategoriesFindMany = jest.fn();
const mockDbSelect = jest.fn();
const mockDbInsert = jest.fn();
const mockDbUpdate = jest.fn();
const mockDbDelete = jest.fn();
const mockDbQueryListingsFindMany = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    query: {
      categories: {
        findMany: (...args: any[]) => mockDbQueryCategoriesFindMany(...args),
      },
      listings: {
        findMany: (...args: any[]) => mockDbQueryListingsFindMany(...args),
      },
    },
    select: (...args: any[]) => mockDbSelect(...args),
    insert: (...args: any[]) => mockDbInsert(...args),
    update: (...args: any[]) => mockDbUpdate(...args),
    delete: (...args: any[]) => mockDbDelete(...args),
  },
}));

// Mock drizzle-orm functions if they are used directly in a way that needs mocking
jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'), // Import and retain default behavior
  eq: jest.fn((field, value) => ({ type: 'eq', field: field.name, value })),
  isNull: jest.fn(field => ({ type: 'isNull', field: field.name })),
}));

const mockAdminSession = { user: { role: 'admin' } };
const mockUserSession = { user: { role: 'user' } };

const sampleCategories = [
  { id: 1, name: 'Electronics', parentId: null },
  { id: 2, name: 'Books', parentId: null },
  { id: 3, name: 'Laptops', parentId: 1 },
  { id: 4, name: 'Smartphones', parentId: 1 },
  { id: 5, name: 'Gaming Laptops', parentId: 3 },
];

describe('Category Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset drizzle-orm direct mocks if needed, e.g., eq.mockClear(), isNull.mockClear()
  });

  describe('getCategories', () => {
    it('should fetch categories without relationships', async () => {
      const mockSelectChain = { from: jest.fn().mockResolvedValue(sampleCategories) };
      mockDbSelect.mockReturnValue(mockSelectChain);

      const result = await getCategories(false);
      expect(mockDbSelect).toHaveBeenCalledWith();
      expect(mockSelectChain.from).toHaveBeenCalledWith(categories);
      expect(result).toEqual(sampleCategories);
    });

    it('should fetch categories with relationships', async () => {
      const categoriesWithRelations = sampleCategories.map(c => ({
        ...c,
        parent: null,
        children: [],
      }));
      mockDbQueryCategoriesFindMany.mockResolvedValue(categoriesWithRelations);

      const result = await getCategories(true);
      expect(mockDbQueryCategoriesFindMany).toHaveBeenCalledWith({
        with: { parent: true, children: true },
      });
      expect(result).toEqual(categoriesWithRelations);
    });

    it('should throw an error if fetching fails', async () => {
      mockDbSelect.mockReturnValue({ from: jest.fn().mockRejectedValue(new Error('DB Error')) });
      await expect(getCategories(false)).rejects.toThrow('Failed to fetch categories');

      mockDbQueryCategoriesFindMany.mockRejectedValue(new Error('DB Error'));
      await expect(getCategories(true)).rejects.toThrow('Failed to fetch categories');
    });
  });

  describe('getTopLevelCategories', () => {
    it('should fetch top-level categories', async () => {
      const topLevel = sampleCategories.filter(c => c.parentId === null);
      const mockSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(topLevel),
      };
      mockDbSelect.mockReturnValue(mockSelectChain);

      const result = await getTopLevelCategories();
      expect(mockDbSelect).toHaveBeenCalledWith();
      expect(mockSelectChain.from).toHaveBeenCalledWith(categories);
      expect(mockSelectChain.where).toHaveBeenCalledWith({ type: 'isNull', field: 'parent_id' });
      expect(result).toEqual(topLevel);
    });

    it('should throw an error if fetching fails', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValue(new Error('DB Error')),
      });
      await expect(getTopLevelCategories()).rejects.toThrow('Failed to fetch top-level categories');
    });
  });

  describe('createCategory', () => {
    const newCategoryData = { name: 'New Category', parentId: 1 };
    const createdCategory = { id: 6, ...newCategoryData };

    it('should create a category successfully by an admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const mockInsertChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([createdCategory]),
      };
      mockDbInsert.mockReturnValue(mockInsertChain);

      const result = await createCategory(newCategoryData);
      expect(getServerSession).toHaveBeenCalled();
      expect(mockDbInsert).toHaveBeenCalledWith(categories);
      expect(mockInsertChain.values).toHaveBeenCalledWith({ name: 'New Category', parentId: 1 });
      expect(mockInsertChain.returning).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual(createdCategory);
    });

    it('should throw error if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockUserSession);
      await expect(createCategory(newCategoryData)).rejects.toThrow(
        'Unauthorized: Only admins can create categories'
      );
    });

    it('should throw Zod validation error for invalid data', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      await expect(createCategory({ name: '', parentId: null })).rejects.toThrow(z.ZodError);
    });

    it('should throw error for duplicate category name', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const pgError = new pg.PostgresError('');
      pgError.code = '23505'; // Unique violation
      mockDbInsert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(pgError),
      });
      await expect(createCategory(newCategoryData)).rejects.toThrow(
        'A category with this name already exists'
      );
    });

    it('should throw a generic error if creation fails for other reasons', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      mockDbInsert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('DB Error')),
      });
      await expect(createCategory(newCategoryData)).rejects.toThrow('Failed to create category');
    });
  });

  describe('updateCategory', () => {
    const categoryIdToUpdate = 1;
    const updateData = { name: 'Updated Electronics', parentId: null };
    const updatedCategory = { id: categoryIdToUpdate, ...updateData };

    it('should update a category successfully by an admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const mockUpdateSetChain = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedCategory]),
      };
      const mockUpdateValuesChain = { set: jest.fn().mockReturnValue(mockUpdateSetChain) };
      mockDbUpdate.mockReturnValue(mockUpdateValuesChain);

      const result = await updateCategory(categoryIdToUpdate, updateData);
      expect(mockDbUpdate).toHaveBeenCalledWith(categories);
      expect(mockUpdateValuesChain.set).toHaveBeenCalledWith({
        name: 'Updated Electronics',
        parentId: null,
      });
      expect(mockUpdateSetChain.where).toHaveBeenCalledWith({
        type: 'eq',
        field: 'id',
        value: categoryIdToUpdate,
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual(updatedCategory);
    });

    it('should throw error if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockUserSession);
      await expect(updateCategory(categoryIdToUpdate, updateData)).rejects.toThrow(
        'Unauthorized: Only admins can update categories'
      );
    });

    it('should throw Zod validation error for invalid data', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      await expect(
        updateCategory(categoryIdToUpdate, { name: '', parentId: null })
      ).rejects.toThrow(z.ZodError);
    });

    it('should throw error if category not found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const mockUpdateSetChain = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      }; // No rows updated
      const mockUpdateValuesChain = { set: jest.fn().mockReturnValue(mockUpdateSetChain) };
      mockDbUpdate.mockReturnValue(mockUpdateValuesChain);
      await expect(updateCategory(999, updateData)).rejects.toThrow('Category not found');
    });

    it('should throw error if setting category as its own parent', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      await expect(
        updateCategory(categoryIdToUpdate, { name: 'Test', parentId: categoryIdToUpdate })
      ).rejects.toThrow('A category cannot be its own parent');
    });

    it('should throw error for duplicate category name on update', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const pgError = new pg.PostgresError('');
      pgError.code = '23505';
      const mockUpdateSetChain = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(pgError),
      };
      const mockUpdateValuesChain = { set: jest.fn().mockReturnValue(mockUpdateSetChain) };
      mockDbUpdate.mockReturnValue(mockUpdateValuesChain);
      await expect(updateCategory(categoryIdToUpdate, updateData)).rejects.toThrow(
        'A category with this name already exists'
      );
    });
  });

  describe('deleteCategory', () => {
    const categoryIdToDelete = 2; // Books, assuming no children or listings for mock
    const deletedCategory = { id: categoryIdToDelete, name: 'Books', parentId: null };

    it('should delete a category successfully by an admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      // Mock subcategories check
      const mockSelectSubcategoriesChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDbSelect.mockReturnValueOnce(mockSelectSubcategoriesChain);
      // Mock listings check
      mockDbQueryListingsFindMany.mockResolvedValue([]);
      // Mock delete operation
      const mockDeleteChain = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([deletedCategory]),
      };
      mockDbDelete.mockReturnValue(mockDeleteChain);

      const result = await deleteCategory(categoryIdToDelete);
      expect(mockSelectSubcategoriesChain.where).toHaveBeenCalledWith({
        type: 'eq',
        field: 'parent_id',
        value: categoryIdToDelete,
      });
      expect(mockDbQueryListingsFindMany).toHaveBeenCalledWith({ where: expect.any(Function) });
      expect(mockDbDelete).toHaveBeenCalledWith(categories);
      expect(mockDeleteChain.where).toHaveBeenCalledWith({
        type: 'eq',
        field: 'id',
        value: categoryIdToDelete,
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(result).toEqual(deletedCategory);
    });

    it('should throw error if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockUserSession);
      await expect(deleteCategory(categoryIdToDelete)).rejects.toThrow(
        'Unauthorized: Only admins can delete categories'
      );
    });

    it('should throw error if category has subcategories', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const mockSelectSubcategoriesChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 3, name: 'Laptops', parentId: 1 }]),
      };
      mockDbSelect.mockReturnValueOnce(mockSelectSubcategoriesChain); // Has subcategories
      await expect(deleteCategory(1)).rejects.toThrow(
        'Cannot delete a category with subcategories'
      );
    });

    it('should throw error if category has listings', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const mockSelectSubcategoriesChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDbSelect.mockReturnValueOnce(mockSelectSubcategoriesChain); // No subcategories
      mockDbQueryListingsFindMany.mockResolvedValue([
        { id: 1, title: 'Book Listing', categoryId: categoryIdToDelete },
      ]); // Has listings
      await expect(deleteCategory(categoryIdToDelete)).rejects.toThrow(
        'Cannot delete a category that has listings'
      );
    });

    it('should throw error if category not found for deletion', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
      const mockSelectSubcategoriesChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockDbSelect.mockReturnValueOnce(mockSelectSubcategoriesChain);
      mockDbQueryListingsFindMany.mockResolvedValue([]);
      const mockDeleteChain = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      }; // No rows deleted
      mockDbDelete.mockReturnValue(mockDeleteChain);
      await expect(deleteCategory(999)).rejects.toThrow('Category not found');
    });
  });

  describe('getCategoryPath', () => {
    it('should return the full path for a nested category', async () => {
      const mockSelectChain = { from: jest.fn().mockResolvedValue(sampleCategories) };
      mockDbSelect.mockReturnValue(mockSelectChain);
      const path = await getCategoryPath(5); // Gaming Laptops
      expect(path).toEqual([
        { id: 1, name: 'Electronics' },
        { id: 3, name: 'Laptops' },
        { id: 5, name: 'Gaming Laptops' },
      ]);
    });

    it('should return the path for a top-level category', async () => {
      const mockSelectChain = { from: jest.fn().mockResolvedValue(sampleCategories) };
      mockDbSelect.mockReturnValue(mockSelectChain);
      const path = await getCategoryPath(2); // Books
      expect(path).toEqual([{ id: 2, name: 'Books' }]);
    });

    it('should return an empty path for a non-existent categoryId', async () => {
      const mockSelectChain = { from: jest.fn().mockResolvedValue(sampleCategories) };
      mockDbSelect.mockReturnValue(mockSelectChain);
      const path = await getCategoryPath(999);
      expect(path).toEqual([]);
    });
  });
});
