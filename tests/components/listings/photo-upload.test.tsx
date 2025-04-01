import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoUpload } from '@/components/listings/photo-upload';

// Mock Lucide-React icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>
}));

describe('PhotoUpload', () => {
  const mockProps = {
    photoFiles: [],
    onAddPhotos: jest.fn(),
    onRemovePhoto: jest.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload button and label', () => {
    render(<PhotoUpload {...mockProps} />);

    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText(/Upload up to 10 photos/)).toBeInTheDocument();
  });

  test('handles file upload', () => {
    render(<PhotoUpload {...mockProps} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('+');

    // Create a FileList-like object
    const fileList = {
      0: file,
      length: 1,
      item: (index: number): File | null => index === 0 ? file : null,
      [Symbol.iterator]: function* () {
        yield file;
      },
    } as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: fileList } });

    expect(mockProps.onAddPhotos).toHaveBeenCalledWith(fileList);
  });

  test('renders photo previews', () => {
    const photoFiles = [
      { id: '1', previewUrl: '/test-image-1.jpg' },
      { id: '2', previewUrl: '/test-image-2.jpg' },
    ];

    render(
      <PhotoUpload
        {...mockProps}
        photoFiles={photoFiles}
      />
    );

    const images = screen.getAllByAltText('Product preview');
    expect(images).toHaveLength(2);
  });

  test('handles photo removal', () => {
    const photoFiles = [
      { id: '1', previewUrl: '/test-image.jpg' },
    ];

    render(
      <PhotoUpload
        {...mockProps}
        photoFiles={photoFiles}
      />
    );

    const removeButton = screen.getByTestId('x-icon').closest('button');
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton!);

    expect(mockProps.onRemovePhoto).toHaveBeenCalledWith('1');
  });

  test('disables interactions when submitting', () => {
    const photoFiles = [
      { id: '1', previewUrl: '/test-image.jpg' },
    ];

    render(
      <PhotoUpload
        {...mockProps}
        photoFiles={photoFiles}
        isSubmitting={true}
      />
    );

    const fileInput = screen.getByLabelText('+');
    expect(fileInput).toBeDisabled();

    const removeButton = screen.getByTestId('x-icon').closest('button');
    expect(removeButton).toBeDisabled();
  });

  test('handles file upload with multiple files', () => {
    render(<PhotoUpload {...mockProps} />);

    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    const fileInput = screen.getByLabelText('+');

    // Create a FileList-like object
    const fileList = {
      0: files[0],
      1: files[1],
      length: 2,
      item: (index: number): File | null => index < files.length ? files[index] : null,
      [Symbol.iterator]: function* () {
        yield* files;
      },
    } as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: fileList } });

    expect(mockProps.onAddPhotos).toHaveBeenCalledWith(fileList);
  });

  test('handles empty file selection', () => {
    render(<PhotoUpload {...mockProps} />);

    const fileInput = screen.getByLabelText('+');

    // Create an empty FileList-like object
    const fileList = {
      length: 0,
      item: (index: number): null => null,
      [Symbol.iterator]: function* () { },
    } as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: fileList } });

    expect(mockProps.onAddPhotos).not.toHaveBeenCalled();
  });
}); 