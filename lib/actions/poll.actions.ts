"use server";

import { connectToDatabase } from "@/lib/database";
import Poll, { IPoll } from "@/lib/database/models/poll.model";
import { requirePermission } from "@/lib/auth/rbac";
import { PollFormParams } from "@/types";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getPolls(): Promise<IPoll[]> {
  try {
    await connectToDatabase();
    const polls = await Poll.find().sort({ createdAt: -1 }).lean<IPoll[]>();
    return safeJson(polls);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function getActivePoll(): Promise<IPoll | null> {
  try {
    await connectToDatabase();
    const poll = await Poll.findOne({ status: "active" })
      .sort({ createdAt: -1 })
      .lean<IPoll>();
    return poll ? safeJson(poll) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function createPoll(params: PollFormParams): Promise<IPoll> {
  await requirePermission("polls", "create");
  try {
    await connectToDatabase();
    const poll = await Poll.create({
      question: params.question,
      options: params.options.map((o) => ({ text: o.text, votes: 0 })),
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      status: params.status || "active",
    });
    revalidatePath("/dashboard/polls");
    return safeJson(poll);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updatePoll(id: string, params: Partial<PollFormParams>): Promise<IPoll> {
  await requirePermission("polls", "update");
  try {
    await connectToDatabase();
    const updateData: any = {};
    if (params.question) updateData.question = params.question;
    if (params.status) updateData.status = params.status;
    if (params.startDate) updateData.startDate = new Date(params.startDate);
    if (params.endDate) updateData.endDate = new Date(params.endDate);

    const updated = await Poll.findByIdAndUpdate(id, { $set: updateData }, { returnDocument: "after" });
    if (!updated) throw new Error("Poll not found");
    revalidatePath("/dashboard/polls");
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deletePoll(id: string) {
  await requirePermission("polls", "delete");
  try {
    await connectToDatabase();
    const deleted = await Poll.findByIdAndDelete(id);
    if (!deleted) throw new Error("Poll not found");
    revalidatePath("/dashboard/polls");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Public action — cast a vote on a poll option (no RBAC).
 */
export async function votePoll(pollId: string, optionIndex: number) {
  try {
    await connectToDatabase();
    const poll = await Poll.findById(pollId);
    if (!poll) throw new Error("Poll not found");
    if (poll.status !== "active") throw new Error("Poll is closed");
    if (optionIndex < 0 || optionIndex >= poll.options.length)
      throw new Error("Invalid option");

    poll.options[optionIndex].votes += 1;
    await poll.save();
    return safeJson(poll);
  } catch (error) {
    handleError(error);
    throw error;
  }
}
