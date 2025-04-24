import { render, screen } from '@testing-library/react';
import { DetailedDescription } from '@/components/listings/detailed-description';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => (
      <div className={className} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

// Mock Markdown component
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

describe('DetailedDescription', () => {
  it('renders nothing when longDescription is null', () => {
    const { container } = render(<DetailedDescription longDescription={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when longDescription is empty string', () => {
    const { container } = render(<DetailedDescription longDescription="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the detailed description title when longDescription is provided', () => {
    render(<DetailedDescription longDescription="Test long description" />);
    expect(screen.getByText('Detailed Description')).toBeInTheDocument();
  });

  it('renders the longDescription content with Markdown', () => {
    render(<DetailedDescription longDescription="Test long description" />);
    const markdownComponent = screen.getByTestId('markdown');
    expect(markdownComponent).toHaveTextContent('Test long description');
  });

  it('renders a separator before the description', () => {
    render(<DetailedDescription longDescription="Test long description" />);
    const separator = screen.getByRole('none', { name: '' });
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveAttribute('data-slot', 'separator-root');
  });

  it('applies animation with framer-motion', () => {
    render(<DetailedDescription longDescription="Test long description" />);
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('renders markdown content with correct styling', () => {
    render(<DetailedDescription longDescription="Test long description" />);
    const proseContainer = screen.getByTestId('markdown').parentElement;
    expect(proseContainer).toHaveClass('prose', 'prose-lg', 'dark:prose-invert', 'max-w-none');
  });

  it('properly handles multiline description', () => {
    const multilineDescription = `# Heading

This is a paragraph

* List item 1
* List item 2`;
    
    render(<DetailedDescription longDescription={multilineDescription} />);
    
    // For markdown content, we just check if the content is passed to the Markdown component
    // without checking exact formatting, since that's handled by the Markdown component
    expect(screen.getByTestId('markdown')).toHaveTextContent(/Heading/);
    expect(screen.getByTestId('markdown')).toHaveTextContent(/This is a paragraph/);
    expect(screen.getByTestId('markdown')).toHaveTextContent(/List item 1/);
    expect(screen.getByTestId('markdown')).toHaveTextContent(/List item 2/);
  });
}); 