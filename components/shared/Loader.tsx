import { Loader2 } from "lucide-react";

export default function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 space-y-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
  );
}
