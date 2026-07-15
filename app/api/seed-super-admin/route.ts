import { NextResponse } from 'next/server';
import { seedInitialSuperAdminUser } from '@/lib/actions/rbac.actions';

export async function GET() {
  try {
    const result = await seedInitialSuperAdminUser();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
