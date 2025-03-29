import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateListingForm } from '@/components/listings/create-listing-form';
import { useCreateListing } from '@/lib/hooks/use-create-listing';
import { useRouter } from 'next/navigation';

// Mock the Next.js server components and actions
jest.mock('@/lib/listings/actions', () => ({
  createListing: jest.fn(),
  ListingStatus: {
    Active: 'Active',
    Draft: 'Draft',
    Archived: 'Archived'
  }
}));

// Mock the custom hook
jest.mock('@/lib/hooks/use-create-listing');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Lucide-React icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>
}));

describe('CreateListingForm', () => {
  // Setup default mocks
  const mockCreateListing = {
    form: {
      title: '',
      price: 0,
      description: '',
      longDescription: '',
      categoryId: null,
      status: 'Draft',
    },
    isSubmitting: false,
    photoFiles: [],
    updateForm: jest.fn(),
    addPhoto: jest.fn(),
    removePhoto: jest.fn(),
    saveListingAsDraft: jest.fn(),
    publishListing: jest.fn(),
    reset: jest.fn(),
  };

  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCreateListing as jest.Mock).mockReturnValue(mockCreateListing);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  test('renders form correctly', () => {
    render(<CreateListingForm />);

    // Check that all form fields are rendered
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/detailed description/i)).toBeInTheDocument();
    expect(screen.getByText(/save as draft/i)).toBeInTheDocument();
    expect(screen.getByText(/publish listing/i)).toBeInTheDocument();
  });

  test('updates form values on input change', () => {
    render(<CreateListingForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Product' } });

    expect(mockCreateListing.updateForm).toHaveBeenCalledWith({ title: 'Test Product' });
  });

  test('updates price on input change', () => {
    render(<CreateListingForm />);

    const priceInput = screen.getByLabelText(/price/i);
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    expect(mockCreateListing.updateForm).toHaveBeenCalledWith({ price: 99.99 });
  });

  test('handles file upload', () => {
    render(<CreateListingForm />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('+');

    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });

    fireEvent.change(fileInput);

    expect(mockCreateListing.addPhoto).toHaveBeenCalledWith(file);
  });

  test('renders photo preview', () => {
    const photoFiles = [
      { id: '1', file: new File(['test'], 'test.jpg'), previewUrl: '/test-image.jpg' }
    ];

    (useCreateListing as jest.Mock).mockReturnValue({
      ...mockCreateListing,
      photoFiles,
    });

    render(<CreateListingForm />);

    const imageElement = screen.getByAltText('Product preview');
    expect(imageElement).toBeInTheDocument();
  });

  test('calls saveListingAsDraft when saving as draft', async () => {
    mockCreateListing.saveListingAsDraft.mockResolvedValue(123);

    render(<CreateListingForm />);

    const saveButton = screen.getByText(/save as draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateListing.saveListingAsDraft).toHaveBeenCalled();
    });
  });

  test('calls publishListing when publishing', async () => {
    mockCreateListing.publishListing.mockResolvedValue(123);

    render(<CreateListingForm />);

    const publishButton = screen.getByText(/publish listing/i);
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockCreateListing.publishListing).toHaveBeenCalled();
    });
  });

  test('shows loading state during submission', () => {
    (useCreateListing as jest.Mock).mockReturnValue({
      ...mockCreateListing,
      isSubmitting: true,
    });

    render(<CreateListingForm />);

    const publishButton = screen.getByText('Publishing...');
    expect(publishButton).toBeDisabled();
  });

  test('navigates to listing page after successful creation', async () => {
    const listingId = 123;
    mockCreateListing.publishListing.mockResolvedValue(listingId);

    render(<CreateListingForm />);

    const publishButton = screen.getByText(/publish listing/i);
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(`/listings/${listingId}`);
    });
  });

  test('removes photo when delete button is clicked', () => {
    const photoId = '1';
    const photoFiles = [
      { id: photoId, file: new File(['test'], 'test.jpg'), previewUrl: '/test-image.jpg' }
    ];

    (useCreateListing as jest.Mock).mockReturnValue({
      ...mockCreateListing,
      photoFiles,
    });

    render(<CreateListingForm />);

    const xIcon = screen.getByTestId('x-icon');
    const removeButton = xIcon.closest('button');
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton!);

    expect(mockCreateListing.removePhoto).toHaveBeenCalledWith(photoId);
  });
}); 