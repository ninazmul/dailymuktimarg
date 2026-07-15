import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';

export async function GET() {
  try {
    await connectToDatabase();
    
    const users = await User.find().lean();
    
    console.log("Users in DB:", users);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
