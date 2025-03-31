import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateListingPage from '@/app/(dashboard)/create-listing/page';
import { CreateListingForm } from '@/components/listings/create-listing-form';

// Mock the CreateListingForm component
jest.mock('@/components/listings/create-listing-form', () => ({
  CreateListingForm: jest.fn(() => <div data-testid="mock-create-listing-form" />),
}));

describe('CreateListingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the create listing form', () => {
    render(<CreateListingPage />);

    // Check that the CreateListingForm is rendered
    expect(screen.getByTestId('mock-create-listing-form')).toBeInTheDocument();

    // Verify the CreateListingForm component was called
    expect(CreateListingForm).toHaveBeenCalled();
  });

  test('has correct layout styles', () => {
    const { container } = render(<CreateListingPage />);

    // Check for the main container div with expected styles
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('flex');
    expect(mainDiv).toHaveClass('flex-1');
    expect(mainDiv).toHaveClass('flex-col');
    expect(mainDiv).toHaveClass('p-6');
  });
}); 