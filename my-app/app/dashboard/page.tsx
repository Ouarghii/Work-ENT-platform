"use client";

import { Suspense, useState } from "react";
import { ITunesMusicWidget } from "@/components/ITunesMusicWidget";
import { TeamsSocialWidget } from "@/components/TeamsSocialWidget";
// --- Main Page Component ---
export default function Page() {
  const [isFullscreenMusic, setIsFullscreenMusic] = useState(false);
  const [isFullscreenTeams, setIsFullscreenTeams] = useState(false);

  return (
    <Suspense fallback={<div className="p-4 text-white">Chargement...</div>}>
      <main className="min-h-screen bg-[#11100F] p-4 md:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[720px]">
          <div className="h-full">
            <ITunesMusicWidget
              isFullscreen={isFullscreenMusic}
              onToggleFullscreen={() =>
                setIsFullscreenMusic(!isFullscreenMusic)
              }
            />
          </div>
          <div className="h-full">
            <TeamsSocialWidget
              isFullscreen={isFullscreenTeams}
              onToggleFullscreen={() =>
                setIsFullscreenTeams(!isFullscreenTeams)
              }
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
