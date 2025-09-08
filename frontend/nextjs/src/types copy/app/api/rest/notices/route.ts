import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/backendClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const dayGap = parseInt(searchParams.get('gap') || '15', 10);

    const response = await apiClient.get('/notice_list', {
      params: { category, gap: dayGap }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in notices API:', error);
    throw error;
  }
} 