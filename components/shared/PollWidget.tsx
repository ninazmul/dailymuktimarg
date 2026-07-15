"use client";

import { useState } from "react";
import { votePoll } from "@/lib/actions/poll.actions";
import { IPoll } from "@/lib/database/models/poll.model";
import { toast } from "react-hot-toast";
import { BarChart3 } from "lucide-react";

export default function PollWidget({ poll }: { poll: IPoll }) {
  const [voted, setVoted] = useState(false);
  const [localPoll, setLocalPoll] = useState(poll);
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = localPoll.options.reduce((s, o) => s + o.votes, 0);

  const handleVote = async (idx: number) => {
    if (voted || isVoting) return;
    setIsVoting(true);
    try {
      const updated = await votePoll(localPoll._id.toString(), idx);
      setLocalPoll(updated);
      setVoted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to vote.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">জনমত জরিপ</h3>
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-4">{localPoll.question}</p>

      <div className="space-y-2">
        {localPoll.options.map((opt, idx) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={voted || isVoting}
              className={`w-full text-left rounded-lg border p-3 text-sm transition relative overflow-hidden ${
                voted
                  ? "cursor-default"
                  : "hover:border-primary hover:bg-primary/5 cursor-pointer"
              }`}
            >
              {voted && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex justify-between items-center">
                <span className="font-medium">{opt.text}</span>
                {voted && <span className="text-xs font-bold text-primary">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      {voted && (
        <p className="text-xs text-gray-400 mt-3 text-center">{totalVotes} total votes</p>
      )}
    </div>
  );
}
