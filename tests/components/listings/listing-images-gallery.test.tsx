import { render, screen, fireEvent } from '@testing-library/react';
import ListingImagesGallery from '@/components/listings/listing-images-gallery';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, key }: any) => (
      <div className={className} key={key} data-testid="motion-div">
        {children}
      </div>
    ),
    button: ({ children, className, onClick }: any) => (
      <button className={className} onClick={onClick} data-testid="motion-button">
        {children}
      </button>
    ),
  },
}));

// Mock the Dialog component with properly structured exports
jest.mock('@/components/ui/dialog', () => ({
  __esModule: true,
  Dialog: ({ children, open }: any) => open ? (
    <div data-testid="dialog-open">{children}</div>
  ) : null,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogTrigger: ({ children }: any) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
}));

// Mock the Lucide icons to add testids
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Maximize2: () => <div data-testid="maximize-icon" />,
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, size, variant }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-size={size}
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

describe('ListingImagesGallery', () => {
  const mockImages = [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg',
  ];
  const mockTitle = 'Test Listing';

  it('renders a placeholder when no images are provided', () => {
    render(<ListingImagesGallery images={[]} title={mockTitle} />);
    expect(screen.getByText('No images available')).toBeInTheDocument();
  });

  it('renders the first image by default', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    const image = screen.getAllByRole('img')[0];
    expect(image).toHaveAttribute('src', 'image1.jpg');
    expect(image).toHaveAttribute('alt', 'Test Listing - Image 1');
  });

  it('navigates to the next image when clicking the next button', () => {
    const { container } = render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // Find button that contains the chevron-right icon
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button');
    fireEvent.click(nextButton!);
    
    // The main image should now be the second one
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'image2.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Test Listing - Image 2');
  });

  it('navigates to the previous image when clicking the previous button', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // First go to the second image
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button');
    fireEvent.click(nextButton!);
    
    // Then go back to the first image
    const prevButton = screen.getByTestId('chevron-left-icon').closest('button');
    fireEvent.click(prevButton!);
    
    // The main image should now be the first one again
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
  });

  it('wraps around to the first image after the last one', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // Click next 3 times to go through all images
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button');
    fireEvent.click(nextButton!); // to image2
    fireEvent.click(nextButton!); // to image3
    fireEvent.click(nextButton!); // should wrap to image1
    
    // Should be back to the first image
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
  });

  it('wraps around to the last image when going previous from the first image', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // Click previous from the first image, should go to the last
    const prevButton = screen.getByTestId('chevron-left-icon').closest('button');
    fireEvent.click(prevButton!);
    
    // Should be at the last image
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'image3.jpg');
  });

  it('renders thumbnail buttons for multiple images', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // Should have 3 thumbnails (one for each image)
    const thumbnails = screen.getAllByTestId('motion-button');
    expect(thumbnails.length).toBe(3);
  });

  it('changes the main image when clicking a thumbnail', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // Get all thumbnails and click the second one
    const thumbnails = screen.getAllByTestId('motion-button');
    fireEvent.click(thumbnails[1]);
    
    // The main image should now be the second one
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'image2.jpg');
  });

  it('opens fullscreen dialog when maximize button is clicked', () => {
    render(<ListingImagesGallery images={mockImages} title={mockTitle} />);
    
    // Get the maximize button and click it
    const maximizeButton = screen.getByTestId('maximize-icon').closest('button');
    fireEvent.click(maximizeButton!);
    
    // Dialog should be open
    expect(screen.getByTestId('dialog-open')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('does not render navigation buttons for a single image', () => {
    render(<ListingImagesGallery images={['image1.jpg']} title={mockTitle} />);
    
    // Should not have navigation buttons
    expect(screen.queryByTestId('chevron-left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
  });

  it('does not render thumbnails for a single image', () => {
    render(<ListingImagesGallery images={['image1.jpg']} title={mockTitle} />);
    
    // Should not have thumbnails
    expect(screen.queryByTestId('motion-button')).not.toBeInTheDocument();
  });
}); 