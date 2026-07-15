import { requirePermission } from "@/lib/auth/rbac";
import { getPolls } from "@/lib/actions/poll.actions";
import PollsClient from "./PollsClient";

export const dynamic = "force-dynamic";

export default async function PollsDashboardPage() {
  const access = await requirePermission("polls", "read");
  const polls = await getPolls();
  return <PollsClient initialPolls={polls} access={access} />;
}
