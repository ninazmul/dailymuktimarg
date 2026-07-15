import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';

export async function GET() {
  try {
    console.log("=== Starting debug-access ===");
    const { userId } = await auth();
    console.log("Clerk userId from auth():", userId);
    if (!userId) {
      console.log("No userId found!");
      return NextResponse.json({ success: true, access: null, reason: "No logged in user" });
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    console.log("Clerk user:", clerkUser);
    
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress || "";
    console.log("User email from Clerk:", email);

    await connectToDatabase();

    let dbUser = await User.findOne({ clerkId: userId });
    console.log("User found by clerkId:", dbUser);
    if (!dbUser && email) {
      dbUser = await User.findOne({ email: email.toLowerCase() });
      console.log("User found by email:", dbUser);
    }

    if (dbUser) {
      console.log("dbUser status:", dbUser.status);
      console.log("dbUser permissions:", dbUser.permissions);
    }

    // Replicate getCurrentDashboardAccess logic for detailed debug
    let access = null;
    if (dbUser && dbUser.status !== "suspended") {
      const isSuperAdmin = email.toLowerCase() === "nazmulsaw@gmail.com";
      let permissions: { module: string; actions: string[] }[] = [];
      if (isSuperAdmin) {
        permissions = [];
      } else {
        permissions = (dbUser.permissions ?? []).map((p: any) => ({
          module: p.module,
          actions: p.actions,
        }));
      }
      access = {
        userId,
        dbUserId: dbUser._id.toString(),
        email,
        name: dbUser.name,
        isSuperAdmin,
        permissions,
      };
    }

    console.log("Final access object:", access);
    return NextResponse.json({ success: true, access, reason: access ? null : (dbUser?.status === "suspended" ? "User suspended" : (dbUser ? "User lacks access" : "User not found")) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: (error as Error).message, stack: (error as Error).stack }, { status: 500 });
  }
}
