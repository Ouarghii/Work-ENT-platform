"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACTIVITY_TYPES = [
  { id: "education", name: "Education", icon: "📚" },
  { id: "recreational", name: "Recreational", icon: "🎨" },
  { id: "social", name: "Social", icon: "👥" },
  { id: "diy", name: "DIY", icon: "🛠️" },
  { id: "charity", name: "Charity", icon: "❤️" },
  { id: "cooking", name: "Cooking", icon: "🍳" },
  { id: "relaxation", name: "Relaxation", icon: "🧘" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "busywork", name: "Busywork", icon: "💼" },
  { id: "shop", name: "Shop", icon: "🛒" },
];

export default function SelectionPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      if (selected.length < 4) {
        setSelected([...selected, id]);
      }
    }
  };

  const handleConfirm = () => {
    if (selected.length === 4) {
      // Pass the selected categories as URL parameters
      router.push(`/dashboard?types=${selected.join(",")}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">Select 4 Activities</h1>
        <p className="text-slate-400">
          Choose exactly 4 category feeds to build your main grid dashboard.
          ({selected.length}/4 selected)
        </p>

        {/* Selection Grid */}
        <div className="grid grid-cols-3 gap-4">
          {ACTIVITY_TYPES.map((act) => {
            const isSelected = selected.includes(act.id);
            return (
              <button
                key={act.id}
                onClick={() => toggleSelect(act.id)}
                className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? "border-blue-500 bg-blue-950/40 text-blue-300"
                    : "border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700"
                }`}
              >
                <span className="text-2xl">{act.icon}</span>
                <span className="font-semibold">{act.name}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={selected.length !== 4}
          className={`w-full py-3.5 rounded-lg font-semibold transition ${
            selected.length === 4
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          {selected.length === 4 ? "OK — Launch Dashboard" : "Select 4 items to proceed"}
        </button>
      </div>
    </main>
  );
}