"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Vote, Plus, Trash2, Edit2, X, BarChart3 } from "lucide-react";
import { createPoll, updatePoll, deletePoll, getPolls } from "@/lib/actions/poll.actions";
import { IPoll } from "@/lib/database/models/poll.model";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function PollsClient({
  initialPolls,
  access,
}: {
  initialPolls: IPoll[];
  access: DashboardAccess;
}) {
  const [polls, setPolls] = useState<IPoll[]>(initialPolls);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [status, setStatus] = useState<string>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(access, "polls", "create");
  const canUpdate = hasPermission(access, "polls", "update");
  const canDelete = hasPermission(access, "polls", "delete");
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setQuestion(""); setOptions(["", ""]); setStatus("active"); setEditingId(null);
  };

  const reload = async () => { const data = await getPolls(); setPolls(data); };

  const openEdit = (p: IPoll) => {
    setEditingId(p._id.toString());
    setQuestion(p.question);
    setOptions(p.options.map((o) => o.text));
    setStatus(p.status);
    setIsFormOpen(true);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) => {
    if (options.length <= 2) { toast.error("Minimum 2 options required."); return; }
    setOptions(options.filter((_, i) => i !== idx));
  };
  const updateOption = (idx: number, val: string) => {
    const newOpts = [...options]; newOpts[idx] = val; setOptions(newOpts);
  };

  const handleSubmit = async () => {
    if (!question.trim()) { toast.error("Question is required."); return; }
    const validOpts = options.filter((o) => o.trim());
    if (validOpts.length < 2) { toast.error("At least 2 options required."); return; }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updatePoll(editingId, { question, status: status as any });
        toast.success("Poll updated.");
      } else {
        await createPoll({
          question,
          options: validOpts.map((text) => ({ text })),
          status: status as any,
        });
        toast.success("Poll created.");
      }
      resetForm(); setIsFormOpen(false); await reload();
    } catch (err: any) { toast.error(err.message || "Failed."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this poll?")) return;
    try { await deletePoll(id); toast.success("Poll deleted."); await reload(); }
    catch { toast.error("Failed."); }
  };

  const handleToggleStatus = async (p: IPoll) => {
    try {
      await updatePoll(p._id.toString(), { status: p.status === "active" ? "closed" : "active" });
      await reload();
    } catch { toast.error("Failed."); }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Vote className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">Polls Manager</h2>
        </div>
        {canCreate && (
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Create Poll
          </Button>
        )}
      </div>

      {polls.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl text-gray-500">No polls created yet.</div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
            return (
              <div key={poll._id.toString()} className="border rounded-lg p-5 bg-gray-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{poll.question}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={poll.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                        {poll.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{totalVotes} total votes</span>
                    </div>
                  </div>
                  {canMutate && (
                    <div className="flex gap-1">
                      {canUpdate && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleToggleStatus(poll)}>
                            {poll.status === "active" ? "Close" : "Reopen"}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(poll)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(poll._id.toString())}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Results bars */}
                <div className="space-y-2">
                  {poll.options.map((opt, idx) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-32 truncate">{opt.text}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-primary/80 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          >
                            {pct > 10 && <span className="text-white text-[10px] font-bold">{pct}%</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{opt.votes} votes</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Poll" : "Create Poll"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Poll Question *</Label>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do you think about...?" />
            </div>

            {!editingId && (
              <div className="space-y-2">
                <Label>Answer Options (min 2)</Label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                    />
                    <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={() => removeOption(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1">
                  <Plus className="w-3 h-3" /> Add Option
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingId ? "Save" : "Create Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
