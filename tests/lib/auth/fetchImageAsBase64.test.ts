import { fetchImageAsBase64 } from '@/lib/auth';

describe('fetchImageAsBase64', () => {
  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockBase64 = mockImageBuffer.toString('base64');

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Mock the global fetch
    global.fetch = jest.fn();
  });

  it('should successfully fetch and convert an image to base64', async () => {
    const mockResponse = {
      ok: true,
      arrayBuffer: () => Promise.resolve(mockImageBuffer),
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/jpeg' : null,
      },
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const imageUrl = 'https://picsum.photos/100/100';
    const result = await fetchImageAsBase64(imageUrl);
    
    expect(result).toBeTruthy();
    expect(result).toBe(`data:image/jpeg;base64,${mockBase64}`);
    expect(global.fetch).toHaveBeenCalledWith(imageUrl);
  });

  it('should return null for non-existent images', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const imageUrl = 'https://picsum.photos/invalid-image';
    const result = await fetchImageAsBase64(imageUrl);
    
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(imageUrl);
  });

  it('should return null for network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const imageUrl = 'https://non-existent-domain-12345.com/image.jpg';
    const result = await fetchImageAsBase64(imageUrl);
    
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(imageUrl);
  });

  it('should return null for invalid URLs', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Invalid URL'));

    const imageUrl = 'not-a-valid-url';
    const result = await fetchImageAsBase64(imageUrl);
    
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(imageUrl);
  });
}); 