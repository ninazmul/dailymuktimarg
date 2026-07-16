import { NextResponse } from "next/server";
import { seedDefaultPages } from "@/lib/actions/page.actions";

export async function GET() {
  try {
    await seedDefaultPages();
    return NextResponse.json({ success: true, message: "Default pages seeded successfully" });
  } catch (error) {
    console.error("Error seeding default pages:", error);
    return NextResponse.json({ error: "Failed to seed default pages" }, { status: 500 });
  }
}
