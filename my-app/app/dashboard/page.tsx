"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import dynamic from "next/dynamic";

// --- Interfaces ---
interface ZoomClientProps {
  meetingId: string;
  passcode: string;
  userName: string;
  signature: string;
  sdkKey: string;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
}

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

interface ChatMessage {
  _id?: string;
  sender: string;
  text: string;
  timestamp?: string;
}

interface UserSession {
  id: string;
  username: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface ScheduledEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  meetingId: string;
}

interface Participant {
  id: string;
  name: string;
  isVideoOff: boolean;
  isMuted: boolean;
}

// Client Zoom dynamique
const ZoomClient = dynamic<ZoomClientProps>(
  () => import("@/components/ZoomClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
        Chargement du client Zoom...
      </div>
    ),
  }
);

// --- 1. Arabic Music Widget ---
function ITunesMusicWidget({
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

  const defaultSearch = "Fairouz Amr Diab Arabic Oud";

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
      className={`bg-[#201F1E] border border-[#3B3A39] rounded-xl p-4 flex flex-col h-full w-full shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-0 p-8"
          : "relative"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#3B3A39] pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎵</span>
          <span className="font-semibold text-white tracking-wider text-sm uppercase">
            Arabic Music Stream
          </span>
          <span className="text-[10px] bg-[#6264A7]/20 text-[#A6A7DC] border border-[#6264A7]/40 px-2 py-0.5 rounded font-medium ml-2">
            iTunes API
          </span>
        </div>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Réduire" : "Plein écran"}
          className="p-1.5 bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-300 hover:text-white rounded transition text-xs flex items-center gap-1 cursor-pointer"
        >
          {isFullscreen ? "✕ Quitter" : "⛶ Plein écran"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 my-3 space-y-3 custom-scrollbar">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Chercher (Amr Diab, Fairouz, Nancy, Oud, Dabke)..."
            className="w-full bg-[#11100F] text-xs text-white placeholder-slate-400 border border-[#3B3A39] rounded px-3 py-2 focus:outline-none focus:border-[#6264A7] transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {currentTrack && (
          <div className="bg-[#11100F] p-3 rounded border border-[#3B3A39] flex items-center gap-3">
            <img
              src={currentTrack.image}
              alt={currentTrack.name}
              className="w-12 h-12 rounded object-cover border border-[#3B3A39] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentTrack.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentTrack.artist_name}
              </p>
            </div>
            <button
              onClick={() => togglePlay(currentTrack)}
              className="w-9 h-9 bg-[#6264A7] hover:bg-[#525492] text-white font-bold rounded-full flex items-center justify-center transition shadow shrink-0 cursor-pointer text-xs"
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
          </div>
        )}

        {currentTrack && (
          <audio
            ref={audioRef}
            src={currentTrack.audio}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {query
              ? `Résultats pour "${query}"`
              : "🔥 Titres Populaires Arabes"}
          </p>

          {isLoading ? (
            <div className="animate-pulse space-y-2 py-2">
              <div className="h-7 bg-[#2B2A29] rounded"></div>
              <div className="h-7 bg-[#2B2A29] rounded"></div>
              <div className="h-7 bg-[#2B2A29] rounded"></div>
            </div>
          ) : tracks.length > 0 ? (
            <div className="space-y-1">
              {tracks.map((track) => {
                const active = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => togglePlay(track)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs transition ${
                      active
                        ? "bg-[#6264A7]/30 text-white font-medium border border-[#6264A7]"
                        : "hover:bg-[#2B2A29] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[10px] text-[#A6A7DC]">
                        {active && isPlaying ? "🔊" : "▶"}
                      </span>
                      <span className="truncate">{track.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                      {track.artist_name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              Aucun morceau trouvé pour "{query}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 2. Teams Multi-Functional Social, Meetings & Calendar Widget ---
function TeamsSocialWidget({
  isFullscreen,
  onToggleFullscreen,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "auth" | "chat" | "calendar" | "meetings"
  >("meetings");

  // Auth State
  const [user, setUser] = useState<UserSession | null>({
    id: "1",
    username: "Alex Morgan",
  });
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Chat Conversations
  const [conversations] = useState<Conversation[]>([
    {
      id: "gen",
      name: "Équipe Générale",
      lastMessage: "Prochaine réunion à 14h00",
      time: "11:42",
      unread: 2,
      online: true,
    },
    {
      id: "dev",
      name: "Canal Dev & Ops",
      lastMessage: "Build deployed to staging",
      time: "10:15",
      unread: 0,
      online: true,
    },
    {
      id: "des",
      name: "Design System",
      lastMessage: "Nouveaux composants validés",
      time: "Hier",
      unread: 0,
      online: false,
    },
    {
      id: "usr1",
      name: "Sarah Connor",
      lastMessage: "Peux-tu vérifier le rapport ?",
      time: "Lun",
      unread: 1,
      online: true,
    },
  ]);
  const [activeConversation, setActiveConversation] = useState<string>("gen");
// Auth Form Submission Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Veuillez remplir tous les champs.");
      return;
    }

    setIsAuthLoading(true);

    try {
      // Replace with your actual backend authentication endpoint if available
      // Example: const res = await fetch('/api/auth/login', { ... });
      
      // Simulated Auth Success:
      setUser({
        id: Date.now().toString(),
        username: authUsername.trim(),
      });
      setAuthUsername("");
      setAuthPassword("");
    } catch (err) {
      setAuthError("Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setIsAuthLoading(false);
    }
  };
  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      _id: "1",
      sender: "Sarah Connor",
      text: "Bonjour à tous! On valide la feuille de route aujourd'hui?",
      timestamp: "11:30",
    },
    {
      _id: "2",
      sender: "Alex Morgan",
      text: "Oui, la réunion est prévue sur Zoom dans l'onglet Meetings.",
      timestamp: "11:32",
    },
  ]);
  const [newMessageText, setNewMessageText] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // In-Meeting Chat State
  const [meetingMessages, setMeetingMessages] = useState<ChatMessage[]>([
    {
      _id: "m1",
      sender: "Système",
      text: "La réunion a commencé.",
      timestamp: "14:00",
    },
  ]);
  const [newMeetingMsg, setNewMeetingMsg] = useState("");
  const [showInMeetingChat, setShowInMeetingChat] = useState<boolean>(false);
  const meetingChatScrollRef = useRef<HTMLDivElement | null>(null);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-29");
  const [events, setEvents] = useState<ScheduledEvent[]>([
    {
      id: "e1",
      title: "Synchro d'équipe hebdomadaire",
      time: "10:00 - 11:00",
      date: "2026-07-29",
      meetingId: "8492049182",
    },
    {
      id: "e2",
      title: "Revue de Sprint",
      time: "14:30 - 15:30",
      date: "2026-07-29",
      meetingId: "9182371928",
    },
  ]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("16:00 - 17:00");

  // Meetings & Zoom Config
  const [meetingMode, setMeetingMode] = useState<"join" | "create" | "invite">(
    "join"
  );
  const [meetingId, setMeetingId] = useState("8492049182");
  const [passcode, setPasscode] = useState("");
  const [guestName, setGuestName] = useState("Invité Teams");
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isZoomLoading, setIsZoomLoading] = useState(false);
  const [zoomAuth, setZoomAuth] = useState<{
    signature: string;
    sdkKey: string;
  } | null>(null);

  // Simulated Remote Grid Participants
  const [participants] = useState<Participant[]>([
    { id: "1", name: "Alice Martin", isVideoOff: false, isMuted: true },
    { id: "2", name: "Bob Smith", isVideoOff: true, isMuted: false },
  ]);

  // --- WebRTC Hardware States & Video Refs ---
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // 🎥 Activation réelle du Microphone et de la Caméra
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoMuted(false);
      setIsAudioMuted(false);
    } catch (err) {
      console.error("Erreur d'accès à la caméra/micro:", err);
      alert(
        "Impossible d'accéder à la caméra ou au microphone. Vérifiez les permissions de votre navigateur."
      );
    }
  };

  // Stop local stream
  const stopLocalMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Bind local camera stream on DOM mount / toggle updates
  useEffect(() => {
    if (isJoined && mediaStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isJoined, isVideoMuted]);

  // Bind screen share stream on DOM mount / toggle updates
  useEffect(() => {
    if (isScreenSharing && screenStreamRef.current && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [isScreenSharing]);

  // Toggle Camera Track
  const toggleCamera = async () => {
    if (isVideoMuted) {
      if (!mediaStreamRef.current) {
        await startLocalMedia();
      } else {
        const videoTracks = mediaStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].enabled = true;
        } else {
          await startLocalMedia();
        }
      }
      setIsVideoMuted(false);
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getVideoTracks()
          .forEach((track) => (track.enabled = false));
      }
      setIsVideoMuted(true);
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isAudioMuted;
      });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // 🖥️ Activation du Partage d'écran
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Erreur de partage d'écran:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  // --- Connection Zoom / Meeting Join ---
  const joinMeeting = async () => {
    if (!meetingId) {
      alert("Veuillez entrer un ID de réunion.");
      return;
    }

    setIsZoomLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/zoom/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingNumber: meetingId.replace(/\s+/g, ""),
          role: 0,
        }),
      });

      if (!res.ok) throw new Error("Impossible d'obtenir la clé SDK Zoom.");

      const { signature, sdkKey } = await res.json();
      setZoomAuth({ signature, sdkKey });
      setIsJoined(true);
      await startLocalMedia();
    } catch (error) {
      console.error("Zoom Auth Error:", error);
      setIsJoined(true); // Fallback WebRTC pur si Zoom API Backend n'est pas dispo
      await startLocalMedia();
    } finally {
      setIsZoomLoading(false);
    }
  };

  const leaveMeeting = () => {
    stopLocalMedia();
    stopScreenShare();
    setIsJoined(false);
    setZoomAuth(null);
  };

  useEffect(() => {
    return () => {
      stopLocalMedia();
      stopScreenShare();
    };
  }, []);

  // Handlers Auth & Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user) return;

    const newMsg: ChatMessage = {
      _id: Date.now().toString(),
      sender: user.username,
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessageText("");
  };

  const handleSendInMeetingMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingMsg.trim()) return;

    const msg: ChatMessage = {
      _id: Date.now().toString(),
      sender: user ? user.username : guestName,
      text: newMeetingMsg.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMeetingMessages((prev) => [...prev, msg]);
    setNewMeetingMsg("");
  };

  const handleCreateMeeting = () => {
    const generatedId = Math.floor(
      100000000 + Math.random() * 900000000
    ).toString();
    setCreatedMeetingId(generatedId);
    setMeetingId(generatedId);
  };

  const handleCopyInvite = () => {
    const link = `https://teams.microsoft.com/l/meetup-join/${
      meetingId || "8492049182"
    }`;
    navigator.clipboard.writeText(
      `Rejoignez ma réunion Teams :\nID : ${
        meetingId || "8492049182"
      }\nLien : ${link}`
    );
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const handleAddCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const generatedId = Math.floor(
      100000000 + Math.random() * 900000000
    ).toString();
    const newEv: ScheduledEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      time: newEventTime,
      date: selectedDate,
      meetingId: generatedId,
    };

    setEvents((prev) => [...prev, newEv]);
    setNewEventTitle("");
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (meetingChatScrollRef.current) {
      meetingChatScrollRef.current.scrollTop =
        meetingChatScrollRef.current.scrollHeight;
    }
  }, [meetingMessages, showInMeetingChat]);

  return (
    <div
      className={`bg-[#1F1F1F] border border-[#3B3A39] rounded-xl flex h-full w-full shadow-2xl overflow-hidden text-slate-200 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "relative"
      }`}
    >
      {/* --- Left Navigation Rail --- */}
      <div className="w-14 bg-[#201F1E] border-r border-[#292827] flex flex-col items-center py-3 space-y-4 shrink-0">
        <div className="w-8 h-8 bg-[#6264A7] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
          T
        </div>

        <div className="w-full flex-1 flex flex-col items-center space-y-2 pt-2">
          <button
            onClick={() => setActiveTab("chat")}
            title="Chat"
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition text-[10px] ${
              activeTab === "chat"
                ? "bg-[#292827] text-[#A6A7DC] border-l-2 border-[#6264A7]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-base">💬</span>
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            title="Calendrier"
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition text-[10px] ${
              activeTab === "calendar"
                ? "bg-[#292827] text-[#A6A7DC] border-l-2 border-[#6264A7]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-base">📅</span>
            <span>Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab("meetings")}
            title="Réunions"
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition text-[10px] ${
              activeTab === "meetings"
                ? "bg-[#292827] text-[#A6A7DC] border-l-2 border-[#6264A7]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-base">📹</span>
            <span>Appels</span>
          </button>
        </div>

        <button
          onClick={() => setActiveTab("auth")}
          title="Profil / Auth"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition text-xs font-semibold border ${
            activeTab === "auth"
              ? "border-[#6264A7] bg-[#6264A7]/30 text-white"
              : "border-[#3B3A39] bg-[#2B2A29] text-slate-300"
          }`}
        >
          {user ? user.username.charAt(0).toUpperCase() : "👤"}
        </button>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Réduire" : "Plein écran"}
          className="text-slate-400 hover:text-white text-xs p-1"
        >
          {isFullscreen ? "✕" : "⛶"}
        </button>
      </div>

      {/* --- Dynamic Content Area --- */}
      <div className="flex-1 flex overflow-hidden bg-[#292827]">
        {/* TAB 1: CHAT */}
        {activeTab === "chat" && (
          <div className="flex-1 flex h-full overflow-hidden">
            <div className="w-56 bg-[#201F1E] border-r border-[#292827] flex flex-col h-full shrink-0">
              <div className="p-3 border-b border-[#292827] flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Discussions
                </span>
                <span className="text-xs bg-[#2B2A29] px-1.5 py-0.5 rounded text-slate-400">
                  Teams
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-0.5 p-1.5 custom-scrollbar">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversation(c.id)}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition text-xs ${
                      activeConversation === c.id
                        ? "bg-[#2B2B38] text-white border-l-2 border-[#6264A7]"
                        : "hover:bg-[#2B2A29] text-slate-300"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full bg-[#464775] text-white flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      {c.online && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full absolute bottom-0 right-0 border border-[#201F1E]"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold truncate text-[11px] text-slate-200">
                          {c.name}
                        </p>
                        <span className="text-[9px] text-slate-500">
                          {c.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {c.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col h-full justify-between bg-[#1F1F1F] p-3 overflow-hidden">
              <div className="border-b border-[#292827] pb-2 flex justify-between items-center shrink-0">
                <span className="font-semibold text-sm text-white">
                  {
                    conversations.find((c) => c.id === activeConversation)
                      ?.name
                  }
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  En ligne
                </span>
              </div>

              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 custom-scrollbar text-xs"
              >
                {messages.map((msg, index) => {
                  const isMe = user?.username === msg.sender;
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {msg.sender}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-lg max-w-[80%] break-words text-xs shadow-sm ${
                          isMe
                            ? "bg-[#6264A7] text-white rounded-tr-none"
                            : "bg-[#2B2A29] text-slate-200 rounded-tl-none border border-[#3B3A39]"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 shrink-0 pt-2 border-t border-[#292827]"
              >
                <input
                  type="text"
                  disabled={!user}
                  placeholder={
                    user
                      ? "Tapez votre message..."
                      : "Connectez-vous pour participer"
                  }
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 bg-[#11100F] border border-[#3B3A39] rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6264A7]"
                />
                <button
                  type="submit"
                  disabled={!user || !newMessageText.trim()}
                  className="bg-[#6264A7] hover:bg-[#525492] text-white px-4 py-2 rounded text-xs font-semibold transition disabled:opacity-50"
                >
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: CALENDAR */}
        {activeTab === "calendar" && (
          <div className="flex-1 flex flex-col h-full bg-[#1F1F1F] p-4 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-[#292827] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Calendrier Teams
                </h3>
                <p className="text-[11px] text-slate-400">
                  Planifiez et rejoignez vos réunions programmées
                </p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#11100F] text-xs text-white border border-[#3B3A39] px-2.5 py-1.5 rounded focus:outline-none focus:border-[#6264A7]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#201F1E] border border-[#3B3A39] rounded-lg p-3 h-fit">
                <h4 className="text-xs font-semibold text-slate-200 mb-2">
                  ➕ Programmer une réunion
                </h4>
                <form onSubmit={handleAddCalendarEvent} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Titre de la réunion"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-[#11100F] text-xs text-white border border-[#3B3A39] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#6264A7]"
                  />
                  <input
                    type="text"
                    placeholder="Créneau (ex: 14:00 - 15:00)"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-[#11100F] text-xs text-white border border-[#3B3A39] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#6264A7]"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#6264A7] hover:bg-[#525492] text-white text-xs py-1.5 rounded font-medium transition"
                  >
                    Ajouter à l'agenda
                  </button>
                </form>
              </div>

              <div className="md:col-span-2 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">
                  Événements du {selectedDate}
                </h4>
                {events.filter((e) => e.date === selectedDate).length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-[#3B3A39] rounded">
                    Aucune réunion prévue pour cette date.
                  </p>
                ) : (
                  events
                    .filter((e) => e.date === selectedDate)
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-[#201F1E] border-l-4 border-[#6264A7] border-y border-r border-[#3B3A39] p-3 rounded-r-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">
                            {ev.title}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ⏰ {ev.time} | ID: {ev.meetingId}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setMeetingId(ev.meetingId);
                            setActiveTab("meetings");
                            setMeetingMode("join");
                          }}
                          className="bg-[#6264A7] hover:bg-[#525492] text-white px-3 py-1.5 rounded text-xs transition"
                        >
                          Rejoindre
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEETINGS WITH 4-SCREEN GRID CATEGORIES */}
        {activeTab === "meetings" && (
          <div className="flex-1 flex h-full bg-[#11100F] overflow-hidden">
            {!isJoined ? (
              <div className="flex-1 p-6 flex flex-col justify-center items-center">
                <div className="max-w-md w-full bg-[#201F1E] border border-[#3B3A39] rounded-xl p-6 shadow-xl">
                  <div className="flex gap-2 border-b border-[#3B3A39] pb-3 mb-4 text-xs font-medium">
                    <button
                      onClick={() => setMeetingMode("join")}
                      className={`flex-1 py-1.5 rounded transition ${
                        meetingMode === "join"
                          ? "bg-[#6264A7] text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Rejoindre
                    </button>
                    <button
                      onClick={() => {
                        setMeetingMode("create");
                        handleCreateMeeting();
                      }}
                      className={`flex-1 py-1.5 rounded transition ${
                        meetingMode === "create"
                          ? "bg-[#6264A7] text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => setMeetingMode("invite")}
                      className={`flex-1 py-1.5 rounded transition ${
                        meetingMode === "invite"
                          ? "bg-[#6264A7] text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Inviter
                    </button>
                  </div>

                  {meetingMode === "join" && (
                    <div className="space-y-3 text-xs">
                      <h3 className="font-bold text-sm text-white">
                        Rejoindre une visio
                      </h3>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          ID de la réunion Zoom / Teams
                        </label>
                        <input
                          type="text"
                          value={meetingId}
                          onChange={(e) => setMeetingId(e.target.value)}
                          placeholder="Ex: 8492049182"
                          className="w-full bg-[#11100F] border border-[#3B3A39] rounded px-3 py-2 text-white focus:outline-none focus:border-[#6264A7]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Nom affiché
                        </label>
                        <input
                          type="text"
                          value={user ? user.username : guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full bg-[#11100F] border border-[#3B3A39] rounded px-3 py-2 text-white focus:outline-none focus:border-[#6264A7]"
                        />
                      </div>
                      <button
                        onClick={joinMeeting}
                        disabled={isZoomLoading}
                        className="w-full bg-[#6264A7] hover:bg-[#525492] text-white py-2 rounded font-semibold transition mt-2 flex items-center justify-center gap-2"
                      >
                        {isZoomLoading ? "Connexion..." : "Lancer l'appel vidéo"}
                      </button>
                    </div>
                  )}

                  {meetingMode === "create" && (
                    <div className="space-y-3 text-xs">
                      <h3 className="font-bold text-sm text-white">
                        Nouvelle réunion
                      </h3>
                      <p className="text-slate-400">
                        Votre salon instantané a été généré.
                      </p>
                      <div className="bg-[#11100F] p-3 rounded border border-[#3B3A39] text-center font-mono text-sm text-[#A6A7DC] font-bold">
                        {createdMeetingId}
                      </div>
                      <button
                        onClick={joinMeeting}
                        className="w-full bg-[#6264A7] hover:bg-[#525492] text-white py-2 rounded font-semibold transition"
                      >
                        Démarrer maintenant
                      </button>
                    </div>
                  )}

                  {meetingMode === "invite" && (
                    <div className="space-y-3 text-xs">
                      <h3 className="font-bold text-sm text-white">
                        Partager l'invitation
                      </h3>
                      <p className="text-slate-400">
                        Copiez le lien et transmettez-le aux participants.
                      </p>
                      <button
                        onClick={handleCopyInvite}
                        className="w-full bg-[#2B2A29] border border-[#3B3A39] hover:bg-[#3B3A39] text-slate-200 py-2 rounded font-medium transition flex items-center justify-center gap-2"
                      >
                        {inviteCopied
                          ? "✓ Lien copié !"
                          : "📋 Copier l'invitation"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* --- 4-SCREEN GRID INTERFACE --- */
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col justify-between p-3 bg-black">
                  {/* Grid Container 2x2 Layout */}
                  <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
                    {/* Écran 1: Partage d'écran */}
                    <div className="relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2B2A29] flex items-center justify-center">
                      {isScreenSharing ? (
                        <video
                          ref={screenVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-500 text-center p-4">
                          <span className="text-2xl block mb-1">🖥️</span>
                          <p className="text-xs font-semibold">
                            Écran 1 : Partage d'écran
                          </p>
                          <span className="text-[10px] text-slate-600">
                            Inactif
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300">
                        {isScreenSharing ? "Partage Actif" : "Flux Partage"}
                      </div>
                    </div>

                    {/* Écran 2: Caméra Locale (Vous) */}
                    <div className="relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2B2A29] flex items-center justify-center">
                      {!isVideoMuted ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#201F1E]">
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-xs text-slate-400">
                            {user ? user.username : guestName}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 flex items-center gap-1">
                        <span>{user ? user.username : guestName} (Vous)</span>
                        {isAudioMuted && (
                          <span className="text-red-400">🔇</span>
                        )}
                      </div>
                    </div>

                    {/* Écran 3: Participant Distant 1 */}
                    <div className="relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2B2A29] flex items-center justify-center">
                      {!participants[0].isVideoOff ? (
                        <div className="w-full h-full bg-[#201F1E] flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-[#6264A7] flex items-center justify-center text-lg font-bold text-white shadow-inner">
                            {participants[0].name.charAt(0)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#201F1E]">
                          <span className="text-xs text-slate-400">
                            {participants[0].name}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 flex items-center gap-1">
                        <span>{participants[0].name}</span>
                        {participants[0].isMuted && (
                          <span className="text-red-400">🔇</span>
                        )}
                      </div>
                    </div>

                    {/* Écran 4: Participant Distant 2 */}
                    <div className="relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#2B2A29] flex items-center justify-center">
                      {!participants[1].isVideoOff ? (
                        <div className="w-full h-full bg-[#201F1E] flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                            {participants[1].name.charAt(0)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#201F1E]">
                          <span className="text-xs text-slate-400">
                            {participants[1].name}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 flex items-center gap-1">
                        <span>{participants[1].name}</span>
                        {participants[1].isMuted && (
                          <span className="text-red-400">🔇</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meeting Bottom Toolbar */}
                  <div className="h-14 bg-[#1F1F1F] border border-[#3B3A39] rounded-xl mt-3 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAudio}
                        className={`p-2 rounded-full transition text-xs ${
                          isAudioMuted
                            ? "bg-red-600 text-white"
                            : "bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-200"
                        }`}
                      >
                        {isAudioMuted ? "🔇 Muted" : "🎙️ Micro"}
                      </button>

                      <button
                        onClick={toggleCamera}
                        className={`p-2 rounded-full transition text-xs ${
                          isVideoMuted
                            ? "bg-red-600 text-white"
                            : "bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-200"
                        }`}
                      >
                        {isVideoMuted ? "🚫 Caméra Off" : "📷 Caméra"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleScreenShare}
                        className={`p-2 rounded-full transition text-xs ${
                          isScreenSharing
                            ? "bg-emerald-600 text-white"
                            : "bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-200"
                        }`}
                      >
                        {isScreenSharing
                          ? "⏹ Arrêter Partage"
                          : "🖥️ Partager Écran"}
                      </button>

                      <button
                        onClick={() =>
                          setShowInMeetingChat(!showInMeetingChat)
                        }
                        className={`p-2 rounded-full transition text-xs ${
                          showInMeetingChat
                            ? "bg-[#6264A7] text-white"
                            : "bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-200"
                        }`}
                      >
                        💬 Chat
                      </button>
                    </div>

                    <button
                      onClick={leaveMeeting}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition"
                    >
                      Quitter
                    </button>
                  </div>
                </div>

                {/* Side Panel In-Meeting Chat */}
                {showInMeetingChat && (
                  <div className="w-72 bg-[#1F1F1F] border-l border-[#292827] flex flex-col h-full shrink-0">
                    <div className="p-3 border-b border-[#292827] font-semibold text-xs flex justify-between items-center text-white">
                      <span>Chat de réunion</span>
                      <button
                        onClick={() => setShowInMeetingChat(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div
                      ref={meetingChatScrollRef}
                      className="flex-1 p-3 overflow-y-auto space-y-2 text-xs custom-scrollbar"
                    >
                      {meetingMessages.map((msg, i) => (
                        <div key={msg._id || i} className="bg-[#2B2A29] p-2 rounded border border-[#3B3A39]">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="font-bold text-[#A6A7DC]">{msg.sender}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="text-slate-200 text-xs break-words">{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={handleSendInMeetingMessage}
                      className="p-2 border-t border-[#292827] flex gap-1.5"
                    >
                      <input
                        type="text"
                        value={newMeetingMsg}
                        onChange={(e) => setNewMeetingMsg(e.target.value)}
                        placeholder="Message dans l'appel..."
                        className="flex-1 bg-[#11100F] border border-[#3B3A39] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#6264A7]"
                      />
                      <button
                        type="submit"
                        className="bg-[#6264A7] hover:bg-[#525492] text-white px-3 py-1.5 rounded text-xs transition"
                      >
                        Envoyer
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUTH (Settings & Account) */}
        {activeTab === "auth" && (
          <div className="flex-1 flex flex-col justify-center items-center bg-[#1F1F1F] p-4">
            <div className="max-w-xs w-full bg-[#201F1E] border border-[#3B3A39] rounded-xl p-5 shadow-xl text-xs">
              <h3 className="font-bold text-sm text-white mb-2 text-center">
                Compte utilisateur
              </h3>
              {user ? (
                <div className="space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#6264A7] text-white mx-auto flex items-center justify-center font-bold text-base">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-[10px] text-slate-400">Connecté</p>
                  </div>
                  <button
                    onClick={() => setUser(null)}
                    className="w-full bg-red-600/20 border border-red-800 text-red-400 hover:bg-red-600/30 py-1.5 rounded transition font-medium"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                  {authError && (
                    <div className="p-1.5 bg-red-950/60 border border-red-800 text-red-400 rounded text-[10px]">
                      {authError}
                    </div>
                  )}
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full bg-[#11100F] border border-[#3B3A39] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#6264A7]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-[#11100F] border border-[#3B3A39] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#6264A7]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-[#6264A7] hover:bg-[#525492] text-white py-1.5 rounded font-semibold transition"
                  >
                    {isAuthLoading ? "Chargement..." : "Se connecter"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function Page() {
  const [isFullscreenMusic, setIsFullscreenMusic] = useState(false);
  const [isFullscreenTeams, setIsFullscreenTeams] = useState(false);

  return (
    <Suspense fallback={<div className="p-4 text-white">Chargement...</div>}>
      <main className="min-h-screen bg-[#11100F] p-4 md:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
          <div className="lg:col-span-1 h-full">
            <ITunesMusicWidget
              isFullscreen={isFullscreenMusic}
              onToggleFullscreen={() =>
                setIsFullscreenMusic(!isFullscreenMusic)
              }
            />
          </div>
          <div className="lg:col-span-2 h-full">
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