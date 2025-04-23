import { redirect } from 'next/navigation';
import DashboardPage from '@/app/(dashboard)/page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('DashboardPage', () => {
  it('redirects to listings page', () => {
    DashboardPage();
    expect(redirect).toHaveBeenCalledWith('/listings');
  });
}); 