import { NextResponse } from 'next/server';
import MySQL from '@/lib/db/mysql';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '무관';
    const dayGap = parseInt(searchParams.get('gap') || '15', 10);

    const mysql = new MySQL();
    const notices = await mysql.findNoticesByCategory(category, dayGap);
    await mysql.close();

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error in notices API:', error);
    throw error;
  }
} 