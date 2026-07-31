"use client";

import { useEffect, useRef, useState } from "react";

interface Track {
  id: number;
  name: string;
  artist_name: string;
  album_name: string;
  image: string;
  audio: string;
}

interface ITunesTrackResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100?: string;
  previewUrl: string;
}

export function ITunesMusicWidget({
  isFullscreen,
  onToggleFullscreen,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const defaultSearch = "Samara Galbi";

  const fetchTracks = async (searchTerm: string) => {
    setIsLoading(true);
    const termToSearch = searchTerm.trim() !== "" ? searchTerm : defaultSearch;

    try {
      const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(
        termToSearch
      )}&entity=song&limit=12`;

      const res = await fetch(endpoint);
      const json = await res.json();

      if (json.results && json.results.length > 0) {
        const mappedTracks: Track[] = json.results.map(
          (item: ITunesTrackResult) => ({
            id: item.trackId,
            name: item.trackName,
            artist_name: item.artistName,
            album_name: item.collectionName,
            image: item.artworkUrl100
              ? item.artworkUrl100.replace("100x100bb", "300x300bb")
              : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
            audio: item.previewUrl,
          })
        );

        setTracks(mappedTracks);
        if (!currentTrack && mappedTracks.length > 0) {
          setCurrentTrack(mappedTracks[0]);
        }
      } else {
        setTracks([]);
      }
    } catch (err) {
      console.error("iTunes API error:", err);
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTracks(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const togglePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }, 150);
    }
  };

  return (
    <div
      className={`bg-[#17161A] border border-[#2A2A33] rounded-[30px] p-4 flex flex-col h-full w-full shadow-[0_40px_80px_-40px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-0 p-8"
          : "relative"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#292930] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5A55A8] to-[#2B3B93] shadow-[0_0_30px_rgba(106,90,205,0.25)] flex items-center justify-center text-white text-xl font-bold">
            ♫
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 font-semibold">
              iTunes Music Widget
            </p>
            <h2 className="text-white text-xl font-semibold">
              Samara Galbi & Arabic Hits
            </h2>
          </div>
        </div>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Réduire" : "Plein écran"}
          className="inline-flex items-center gap-2 rounded-full bg-[#25242C] border border-[#3B3A41] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#2F2D39]"
        >
          {isFullscreen ? "Quitter" : "Plein écran"}
          <span>{isFullscreen ? "✕" : "⛶"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 mt-4 h-full">
        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] bg-[#1B1A1F] border border-[#2A2A33] p-5 shadow-[inset_0_0_40px_rgba(34,31,39,0.4)]">
            <div className="relative mx-auto w-52 h-52">
              <div
                className={`absolute inset-0 rounded-full border border-[#3A3650] bg-gradient-to-br from-[#232031] to-[#111014] shadow-[0_0_40px_rgba(97,92,171,0.3)] ${
                  isPlaying ? "animate-spin" : ""
                }`}
                style={{ animationDuration: isPlaying ? "12s" : "0s" }}
              />
              <div className="absolute inset-10 rounded-full overflow-hidden border-4 border-[#11100F] bg-[#0F0D11]">
                <img
                  src={currentTrack?.image}
                  alt={currentTrack?.name || "Samara Galbi"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4B4A59] bg-[#18161C] shadow-[0_0_20px_rgba(0,0,0,0.25)]" />
            </div>

            <div className="mt-5 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
                Now Playing
              </p>
              <p className="text-white text-lg font-semibold leading-tight">
                {currentTrack?.name || "Samara Galbi"}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {currentTrack?.artist_name || "Samara"}
              </p>
            </div>

            <button
              onClick={() => currentTrack && togglePlay(currentTrack)}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#6C6AD9] to-[#4658C8] px-4 py-3 font-semibold text-white shadow-[0_20px_40px_-25px_rgba(80,74,196,0.8)] transition hover:brightness-110"
            >
              {isPlaying ? "Pause la lecture" : "Écouter Samara Galbi"}
            </button>
          </div>

          <div className="rounded-[28px] bg-[#11100F] border border-[#2A2A33] p-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.7)]">
            <label className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
              Rechercher une piste
            </label>
            <div className="relative mt-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Samara Galbi, Amr Diab, Fairouz..."
                className="w-full rounded-3xl border border-[#2C2C37] bg-[#15131A] py-3 pl-4 pr-10 text-sm text-white outline-none transition focus:border-[#6264A7]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#2B2A34] px-2 py-1 text-[11px] text-slate-300 hover:bg-[#3A3945]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full overflow-hidden rounded-[28px] bg-[#11100F] border border-[#2A2A33] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between border-b border-[#292930] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Liste de lecture</h3>
              <p className="text-[11px] text-slate-500">Touchez une piste pour la lancer.</p>
            </div>
            <span className="rounded-full bg-[#2A2A33] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              {tracks.length} pistes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-2xl bg-[#1A191D] animate-pulse" />
                ))}
              </div>
            ) : tracks.length > 0 ? (
              <div className="grid gap-3">
                {tracks.map((track) => {
                  const active = currentTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => togglePlay(track)}
                      className={`group flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[#5F5CD9] bg-[#25223A] text-white"
                          : "border-[#1C1B1F] bg-[#15131A] text-slate-300 hover:border-[#444068] hover:bg-[#1E1C28]"
                      }`}
                    >
                      <img
                        src={track.image}
                        alt={track.name}
                        className="h-14 w-14 rounded-3xl object-cover border border-[#292930]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{track.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{track.artist_name}</p>
                      </div>
                      <span className="text-xs text-slate-400">{track.album_name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#2A2A33] bg-[#16151A] p-6 text-center text-slate-500">
                Aucun morceau trouvé pour "{query || defaultSearch}"
              </div>
            )}
          </div>
        </div>
      </div>

      {currentTrack && (
        <audio ref={audioRef} src={currentTrack.audio} onEnded={() => setIsPlaying(false)} />
      )}
    </div>
  );
}
