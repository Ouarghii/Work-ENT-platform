"use client";

import { Suspense, useState } from "react";
import { ITunesMusicWidget } from "@/components/ITunesMusicWidget";
import { ShopWidget } from "@/components/ShopWidget";
import { TeamsSocialWidget } from "@/components/TeamsSocialWidget";

// --- Main Page Component ---
export default function Page() {
  const [isFullscreenMusic, setIsFullscreenMusic] = useState(false);
  const [isFullscreenTeams, setIsFullscreenTeams] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const showPreviousPage = () => setPageIndex((prev) => Math.max(prev - 1, 0));
  const showNextPage = () => setPageIndex((prev) => Math.min(prev + 1, 2));

  return (
    <Suspense fallback={<div className="p-4 text-white">Chargement...</div>}>
      <main className="min-h-screen bg-[#11100F] p-4 md:p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-[32px] border border-[#2D3140] bg-[#141827] p-4 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Vue multi-écrans</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Tableau de bord</h1>
            <p className="mt-1 text-sm text-slate-400">
              Passez de l’écran principal aux écrans supplémentaires avec les flèches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={showPreviousPage}
              disabled={pageIndex === 0}
              className="rounded-full border border-[#2D3140] bg-[#10131E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1B1F33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              ←
            </button>
            <span className="text-sm text-slate-300">Écran {pageIndex + 1} / 3</span>
            <button
              onClick={showNextPage}
              disabled={pageIndex === 2}
              className="rounded-full border border-[#2D3140] bg-[#10131E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1B1F33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[720px]">
          {pageIndex === 0 ? (
            <>
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
            </>
          ) : pageIndex === 1 ? (
            <>
              <div className="h-full">
                <ShopWidget />
              </div>
              <div className="h-full rounded-[30px] border border-dashed border-[#2D3140] bg-[#121524] p-6 text-slate-200 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="inline-flex rounded-full bg-[#2B4A82] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#B8D1FF]">
                      Boutique
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold text-white">Plateforme e-commerce</h2>
                    <p className="mt-4 text-sm text-slate-400 leading-6">
                      Découvrez l’interface complète du shop, le panier, le paiement et l’historique de commandes.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-[#161C33] p-4 text-sm text-slate-300 shadow-inner">
                      <p className="font-semibold text-white">Catalogue dynamique</p>
                      <p className="mt-2 text-slate-400">
                        Filtres avancés, recherche, tri et affichage de produits modernes.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-[#161C33] p-4 text-sm text-slate-300 shadow-inner">
                      <p className="font-semibold text-white">Paiement sécurisé</p>
                      <p className="mt-2 text-slate-400">
                        Simulation de paiement et validation de commande pour une expérience complète.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-full rounded-[30px] border border-dashed border-[#2D3140] bg-[#121524] p-6 text-slate-200 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="inline-flex rounded-full bg-[#283A7A] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#B1B8FF]">
                      Écran 4
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold text-white">Prévisualisation arrière</h2>
                    <p className="mt-4 text-sm text-slate-400 leading-6">
                      La dernière page est un espace idéal pour ajouter des accessoires, analytics ou widgets personnalisés.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-[#161C33] p-4 text-sm text-slate-300 shadow-inner">
                      <p className="font-semibold text-white">Agenda & tâches</p>
                      <p className="mt-2 text-slate-400">
                        Ajoutez vos listes de tâches, calendrier et indicateurs de projet ici.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-[#161C33] p-4 text-sm text-slate-300 shadow-inner">
                      <p className="font-semibold text-white">Statistiques clés</p>
                      <p className="mt-2 text-slate-400">
                        Présentez des graphiques, métriques ou rapports d’utilisation de l’application.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-full rounded-[30px] border border-dashed border-[#2D3140] bg-[#121524] p-6 text-slate-200 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="inline-flex rounded-full bg-[#283A7A] px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#B1B8FF]">
                      Écran 5
                    </div>
                    <h2 className="mt-6 text-3xl font-semibold text-white">Extensions à venir</h2>
                    <p className="mt-4 text-sm text-slate-400 leading-6">
                      Utilisez cet écran comme page de configuration, support ou pour afficher d’autres catégories.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-[#161C33] p-4 text-sm text-slate-300 shadow-inner">
                      <p className="font-semibold text-white">Personnalisation</p>
                      <p className="mt-2 text-slate-400">
                        Proposez des options d’habillage, thèmes ou préférences de l’utilisateur.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-[#161C33] p-4 text-sm text-slate-300 shadow-inner">
                      <p className="font-semibold text-white">Support & aide</p>
                      <p className="mt-2 text-slate-400">
                        Un espace pour les guides, contact ou notifications en temps réel.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </Suspense>
  );
}
