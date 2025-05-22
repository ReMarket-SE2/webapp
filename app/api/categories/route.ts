import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/categories/actions';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
