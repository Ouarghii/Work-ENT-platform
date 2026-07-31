"use client";

import { useEffect, useRef, useState } from "react";

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
  createdBy?: string;
  createdAt?: string;
}

interface Participant {
  id: string;
  name: string;
  isVideoOff: boolean;
  isMuted: boolean;
}

export function TeamsSocialWidget({
  isFullscreen,
  onToggleFullscreen,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "auth" | "chat" | "calendar" | "meetings"
  >("auth");

  const [user, setUser] = useState<UserSession | null>({
    id: "1",
    username: "Alex Morgan",
  });
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Veuillez remplir tous les champs.");
      return;
    }

    setIsAuthLoading(true);

    try {
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [meetingMessages, setMeetingMessages] = useState<ChatMessage[]>([]);
  const [newMeetingMsg, setNewMeetingMsg] = useState("");
  const [showInMeetingChat, setShowInMeetingChat] = useState<boolean>(false);
  const [isMeetingChatLoading, setIsMeetingChatLoading] = useState<boolean>(false);
  const meetingChatScrollRef = useRef<HTMLDivElement | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("2026-07-29");
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("16:00 - 17:00");

  const [meetingMode, setMeetingMode] = useState<"join" | "create" | "invite">(
    "join"
  );
  const [meetingId, setMeetingId] = useState("8492049182");
  const [guestName, setGuestName] = useState("Invité Teams");
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isZoomLoading, setIsZoomLoading] = useState(false);
  const [zoomAuth, setZoomAuth] = useState<{
    signature: string;
    sdkKey: string;
  } | null>(null);

  const [participants] = useState<Participant[]>([
    { id: "1", name: "Alice Martin", isVideoOff: false, isMuted: true },
    { id: "2", name: "Bob Smith", isVideoOff: true, isMuted: false },
  ]);

  const loadMessages = async () => {
    setIsMessagesLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/messages");
      if (!res.ok) throw new Error("Impossible de charger les discussions.");
      const data: ChatMessage[] = await res.json();
      setMessages(
        data.map((message) => ({
          ...message,
          timestamp: message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }))
      );
    } catch (err) {
      console.error("Load messages failed", err);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const loadEvents = async (date: string) => {
    setIsEventsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/events?date=${encodeURIComponent(date)}`
      );
      if (!res.ok) throw new Error("Impossible de charger l'agenda.");
      const data: any[] = await res.json();
      setEvents(
        data.map((event) => ({
          ...event,
          id: event.id || event._id || String(event._id),
        }))
      );
    } catch (err) {
      console.error("Load events failed", err);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const loadMeetingMessages = async (meetingId: string) => {
    if (!meetingId) return;
    setIsMeetingChatLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/meetings/${encodeURIComponent(
          meetingId
        )}/messages`
      );
      if (!res.ok) throw new Error("Impossible de charger le chat de réunion.");
      const data: ChatMessage[] = await res.json();
      setMeetingMessages(
        data.map((message) => ({
          ...message,
          timestamp: message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }))
      );
    } catch (err) {
      console.error("Load meeting messages failed", err);
    } finally {
      setIsMeetingChatLoading(false);
    }
  };

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isAudioPreviewOn, setIsAudioPreviewOn] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      if (audioPreviewRef.current && isAudioPreviewOn) {
        audioPreviewRef.current.srcObject = stream;
        audioPreviewRef.current.play().catch(() => {});
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

  const stopLocalMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    loadMessages();
    loadEvents(selectedDate);
  }, []);

  useEffect(() => {
    loadEvents(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (showInMeetingChat && meetingId) {
      loadMeetingMessages(meetingId);
    }
  }, [showInMeetingChat, meetingId]);

  useEffect(() => {
    if (isJoined && mediaStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isJoined, isVideoMuted]);

  useEffect(() => {
    if (isAudioPreviewOn && mediaStreamRef.current && audioPreviewRef.current) {
      audioPreviewRef.current.srcObject = mediaStreamRef.current;
      audioPreviewRef.current.play().catch(() => {});
    } else if (audioPreviewRef.current) {
      audioPreviewRef.current.srcObject = null;
    }
  }, [isAudioPreviewOn, isJoined]);

  useEffect(() => {
    if (isScreenSharing && screenStreamRef.current && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
      screenVideoRef.current.play().catch(() => {});
    }
  }, [isScreenSharing]);

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

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isAudioMuted;
      });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleAudioPreview = () => {
    setIsAudioPreviewOn((prev) => !prev);
  };

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
      await loadMeetingMessages(meetingId);
    } catch (error) {
      console.error("Zoom Auth Error:", error);
      setIsJoined(true);
      await startLocalMedia();
      await loadMeetingMessages(meetingId);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user) return;

    const payload = {
      sender: user.username,
      text: newMessageText.trim(),
    };

    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur d'envoi du message");
      const savedMessage: ChatMessage = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          ...savedMessage,
          timestamp: savedMessage.timestamp
            ? new Date(savedMessage.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        },
      ]);
      setNewMessageText("");
    } catch (err) {
      console.error("Send message failed", err);
    }
  };

  const handleSendInMeetingMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingMsg.trim()) return;

    const senderName = user ? user.username : guestName;
    const payload = {
      sender: senderName,
      text: newMeetingMsg.trim(),
    };

    try {
      if (meetingId) {
        const res = await fetch(
          `http://localhost:5000/api/meetings/${encodeURIComponent(
            meetingId
          )}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error("Erreur d'envoi du message de réunion.");
        const savedMessage: ChatMessage = await res.json();
        setMeetingMessages((prev) => [
          ...prev,
          {
            ...savedMessage,
            timestamp: savedMessage.timestamp
              ? new Date(savedMessage.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          },
        ]);
      } else {
        setMeetingMessages((prev) => [
          ...prev,
          {
            _id: Date.now().toString(),
            sender: senderName,
            text: newMeetingMsg.trim(),
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
      setNewMeetingMsg("");
    } catch (err) {
      console.error("Send in-meeting message failed", err);
    }
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

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    try {
      const payload = {
        title: newEventTitle,
        time: newEventTime,
        date: selectedDate,
        createdBy: user ? user.username : "guest",
      };
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Impossible de créer l'événement.");
      const savedEvent: any = await res.json();
      setEvents((prev) => [
        ...prev,
        {
          ...savedEvent,
          id: savedEvent.id || savedEvent._id || String(savedEvent._id),
        },
      ]);
      setNewEventTitle("");
    } catch (err) {
      console.error("Create calendar event failed", err);
    }
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
      className={`bg-[#171A25] border border-[#2D3140] rounded-[30px] flex h-full w-full shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85)] overflow-hidden text-slate-200 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "relative"
      }`}
    >
      <div className="w-16 bg-[#1B2031] border-r border-[#2D3140] flex flex-col items-center py-3 space-y-2 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-3xl bg-[#4F4AA9] flex items-center justify-center text-white text-lg font-bold shadow-lg">
            T
          </div>
          <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">
            Teams
          </p>
        </div>

        <div className="w-full flex-1 flex flex-col items-center gap-1 pt-2">
          <button
            onClick={() => setActiveTab("chat")}
            title="Chat"
            className={`w-full rounded-3xl py-3 text-lg transition ${
              activeTab === "chat"
                ? "bg-[#373F66] text-white shadow-lg"
                : "text-slate-400 hover:bg-[#262D45] hover:text-white"
            }`}
          >
            💬
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            title="Calendrier"
            className={`w-full rounded-3xl py-3 text-lg transition ${
              activeTab === "calendar"
                ? "bg-[#373F66] text-white shadow-lg"
                : "text-slate-400 hover:bg-[#262D45] hover:text-white"
            }`}
          >
            📅
          </button>

          <button
            onClick={() => setActiveTab("meetings")}
            title="Réunions"
            className={`w-full rounded-3xl py-3 text-lg transition ${
              activeTab === "meetings"
                ? "bg-[#373F66] text-white shadow-lg"
                : "text-slate-400 hover:bg-[#262D45] hover:text-white"
            }`}
          >
            📹
          </button>
        </div>

        <div className="w-full flex flex-col items-center gap-2">
          <button
            onClick={() => setActiveTab("auth")}
            title="Profil / Auth"
            className={`w-12 h-12 rounded-3xl flex items-center justify-center text-sm font-semibold transition ${
              activeTab === "auth"
                ? "bg-[#5C5BCA] text-white shadow-lg"
                : "bg-[#252B42] text-slate-300 hover:bg-[#313953]"
            }`}
          >
            {user ? user.username.charAt(0).toUpperCase() : "👤"}
          </button>
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Réduire" : "Plein écran"}
            className="inline-flex items-center gap-2 rounded-full bg-[#25242C] border border-[#3B3A41] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#2F2D39]"
          >
            {isFullscreen ? "Quitter" : "Plein écran"}
            <span>{isFullscreen ? "✕" : "⛶"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-[#292827]">
        {activeTab === "chat" && (
          <div className="flex-1 flex h-full overflow-hidden">
            <div className="w-72 bg-[#141B2D] border-r border-[#252F44] flex flex-col h-full shrink-0">
              <div className="px-5 py-4 border-b border-[#252F44]">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 font-semibold">
                  Teams
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  Discussions récentes
                </h3>
              </div>

              <div className="px-5 py-3 border-b border-[#252F44]">
                <input
                  type="text"
                  placeholder="Rechercher une discussion"
                  className="w-full rounded-3xl border border-[#2E374E] bg-[#111626] px-3 py-2 text-xs text-white outline-none transition focus:border-[#6264A7]"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversation(c.id)}
                    className={`w-full text-left rounded-3xl border px-3 py-3 flex items-center gap-3 transition ${
                      activeConversation === c.id
                        ? "border-[#6264A7] bg-[#252F47] text-white"
                        : "border-transparent bg-[#121826] text-slate-300 hover:border-[#2E374E] hover:bg-[#1C2437]"
                    }`}
                  >
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-3xl bg-[#2A3560] text-sm font-bold text-white">
                      {c.name.charAt(0)}
                      {c.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[#141B2D]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {c.name}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {c.time}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-400">
                        {c.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col h-full bg-[#0E1323]">
              <div className="border-b border-[#252F44] px-6 py-4 bg-[#11182F]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                      Conversation active
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {
                        conversations.find((c) => c.id === activeConversation)
                          ?.name
                      }
                    </h3>
                  </div>
                  <span className="rounded-full border border-[#2E374E] bg-[#141B2D] px-3 py-1 text-[11px] text-slate-400">
                    {user ? `${user.username} (Connecté)` : "Invité"}
                  </span>
                </div>
              </div>

              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar"
              >
                {isMessagesLoading ? (
                  <div className="text-slate-400 text-sm">
                    Chargement des messages...
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = user?.username === msg.sender;
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            isMe
                              ? "bg-[#5F5CD9] text-white rounded-br-none"
                              : "bg-[#18203B] text-slate-200 rounded-bl-none border border-[#27304F]"
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                            <span>{msg.sender}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#252F44] bg-[#0D1425] px-6 py-4 flex items-center gap-3"
              >
                <input
                  type="text"
                  disabled={!user}
                  placeholder={
                    user
                      ? "Tapez un message..."
                      : "Connectez-vous pour envoyer un message"
                  }
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 rounded-3xl border border-[#2E374E] bg-[#111626] px-4 py-3 text-sm text-white outline-none focus:border-[#6264A7]"
                />
                <button
                  type="submit"
                  disabled={!user || !newMessageText.trim()}
                  className="rounded-3xl bg-[#5F5CD9] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#7B79F2] disabled:opacity-50"
                >
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="flex-1 flex flex-col h-full bg-[#0D1326]">
            <div className="px-6 py-5 border-b border-[#252F44] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
                  Agenda Teams
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Vos réunions programmées
                </h3>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-3xl border border-[#2E374E] bg-[#111626] px-4 py-3 text-sm text-white outline-none focus:border-[#6264A7]"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 p-6 flex-1 overflow-hidden">
              <div className="rounded-[30px] bg-[#141A2F] border border-[#252F44] p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.7)]">
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">
                  Programmer une réunion
                </h4>
                <form onSubmit={handleAddCalendarEvent} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Titre de la réunion"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full rounded-3xl border border-[#2E374E] bg-[#0F1728] px-4 py-3 text-sm text-white outline-none focus:border-[#6264A7]"
                  />
                  <input
                    type="text"
                    placeholder="Créneau (ex: 14:00 - 15:00)"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full rounded-3xl border border-[#2E374E] bg-[#0F1728] px-4 py-3 text-sm text-white outline-none focus:border-[#6264A7]"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-3xl bg-[#5F5CD9] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7B79F2]"
                  >
                    Ajouter à l'agenda
                  </button>
                </form>
              </div>

              <div className="rounded-[30px] bg-[#141A2F] border border-[#252F44] p-5 overflow-y-auto custom-scrollbar">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Prochaines réunions
                    </p>
                    <p className="text-sm text-slate-300">
                      {events.filter((e) => e.date === selectedDate).length}{" "}
                      événements
                    </p>
                  </div>
                </div>

                {isEventsLoading ? (
                  <div className="text-slate-400">
                    Chargement des événements...
                  </div>
                ) : events.filter((e) => e.date === selectedDate).length ===
                  0 ? (
                  <div className="rounded-3xl border border-dashed border-[#2E374E] bg-[#0F1728] p-6 text-center text-slate-500">
                    Aucune réunion prévue pour {selectedDate}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events
                      .filter((e) => e.date === selectedDate)
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-[26px] border border-[#2E374E] bg-[#111826] p-4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.75)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {ev.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {ev.time}
                              </p>
                            </div>
                            <span className="rounded-full bg-[#252F44] px-3 py-1 text-[10px] text-slate-400">
                              ID {ev.meetingId}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="text-[11px] text-slate-500">
                              Créé par {ev.createdBy || "Invité"}
                            </div>
                            <button
                              onClick={() => {
                                setMeetingId(ev.meetingId);
                                setActiveTab("meetings");
                                setMeetingMode("join");
                              }}
                              className="rounded-3xl bg-[#5F5CD9] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#7B79F2]"
                            >
                              Rejoindre
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="flex-1 flex h-full bg-[#11100F] overflow-hidden">
            {!isJoined ? (
              <div className="flex-1 p-6 flex flex-col justify-center items-center">
                <div className="max-w-2xl w-full overflow-hidden rounded-[36px] border border-[#2B3A67] bg-[#090D24] shadow-[0_40px_120px_-50px_rgba(17,26,56,0.85)]">
                  <div className="relative overflow-hidden rounded-t-[36px] bg-gradient-to-br from-[#2F3E7E] via-[#1B264B] to-[#111625] px-8 py-10 text-white">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#5F5CD9]/20 blur-3xl" />
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-[0.36em] text-slate-400">
                        Barre d'appel
                      </p>
                      <h2 className="mt-4 text-3xl font-semibold">
                        Bienvenue sur Teams
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                        Rejoignez votre réunion en un clic, créez un salon
                        instantané ou partagez une invitation avec votre
                        équipe.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0A1125] px-8 py-7">
                    <div className="mb-6 grid gap-3 sm:grid-cols-3">
                      <button
                        onClick={() => setMeetingMode("join")}
                        className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                          meetingMode === "join"
                            ? "bg-[#5F5CD9] text-white shadow-lg"
                            : "bg-[#10172E] text-slate-300 hover:bg-[#151d34]"
                        }`}
                      >
                        Rejoindre
                      </button>
                      <button
                        onClick={() => {
                          setMeetingMode("create");
                          handleCreateMeeting();
                        }}
                        className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                          meetingMode === "create"
                            ? "bg-[#5F5CD9] text-white shadow-lg"
                            : "bg-[#10172E] text-slate-300 hover:bg-[#151d34]"
                        }`}
                      >
                        Créer
                      </button>
                      <button
                        onClick={() => setMeetingMode("invite")}
                        className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                          meetingMode === "invite"
                            ? "bg-[#5F5CD9] text-white shadow-lg"
                            : "bg-[#10172E] text-slate-300 hover:bg-[#151d34]"
                        }`}
                      >
                        Inviter
                      </button>
                    </div>

                    {meetingMode === "join" && (
                      <div className="space-y-4 text-sm text-slate-300">
                        <div className="space-y-2 rounded-[24px] border border-[#222A45] bg-[#091027] p-4">
                          <label className="block text-xs uppercase tracking-[0.3em] text-slate-500">
                            ID de la réunion
                          </label>
                          <input
                            type="text"
                            value={meetingId}
                            onChange={(e) => setMeetingId(e.target.value)}
                            placeholder="Ex: 8492049182"
                            className="w-full rounded-3xl border border-[#1B243F] bg-[#081123] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                          />
                        </div>
                        <div className="space-y-2 rounded-[24px] border border-[#222A45] bg-[#091027] p-4">
                          <label className="block text-xs uppercase tracking-[0.3em] text-slate-500">
                            Nom affiché
                          </label>
                          <input
                            type="text"
                            value={user ? user.username : guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full rounded-3xl border border-[#1B243F] bg-[#081123] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                          />
                        </div>
                        <button
                          onClick={joinMeeting}
                          disabled={isZoomLoading}
                          className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(95,92,217,0.85)] transition hover:brightness-110 disabled:opacity-60"
                        >
                          {isZoomLoading
                            ? "Connexion..."
                            : "Lancer l'appel vidéo"}
                        </button>
                      </div>
                    )}

                    {meetingMode === "create" && (
                      <div className="space-y-4 text-sm text-slate-300">
                        <div className="rounded-[24px] border border-[#222A45] bg-[#091027] p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            Salon instantané
                          </p>
                          <div className="mt-3 rounded-3xl bg-[#081123] px-4 py-4 text-center font-mono text-sm text-[#A6A7DC]">
                            {createdMeetingId}
                          </div>
                        </div>
                        <button
                          onClick={joinMeeting}
                          className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(95,92,217,0.85)] transition hover:brightness-110"
                        >
                          Démarrer maintenant
                        </button>
                      </div>
                    )}

                    {meetingMode === "invite" && (
                      <div className="space-y-4 text-sm text-slate-300">
                        <div className="rounded-[24px] border border-[#222A45] bg-[#091027] p-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            Partager
                          </p>
                          <p className="mt-2 text-sm text-slate-400">
                            Copiez le lien et envoyez-le à vos invités.
                          </p>
                        </div>
                        <button
                          onClick={handleCopyInvite}
                          className="w-full rounded-3xl border border-[#2B3C72] bg-[#10172E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#152056]"
                        >
                          {inviteCopied
                            ? "✓ Lien copié !"
                            : "📋 Copier l'invitation"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#090D1F]">
                <div className="border-b border-[#1A203C] bg-[#071027] px-6 py-4 text-white">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                        Appel en direct
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        Meeting {meetingId || "en cours"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>En direct • {user?.username || guestName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden p-3">
                  <div className="flex-1 flex flex-col justify-between rounded-[30px] border border-[#1A203C] bg-[#0A1023] p-4">
                    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
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
                      <audio
                        ref={audioPreviewRef}
                        autoPlay
                        className="hidden"
                      />

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
                          {isAudioMuted ? "🔇 Micro coupé" : "🎙️ Micro"}
                        </button>

                        <button
                          onClick={toggleCamera}
                          className={`p-2 rounded-full transition text-xs ${
                            isVideoMuted
                              ? "bg-red-600 text-white"
                              : "bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-200"
                          }`}
                        >
                          {isVideoMuted ? "🚫 Caméra off" : "📷 Caméra"}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleAudioPreview}
                          className={`p-2 rounded-full transition text-xs ${
                            isAudioPreviewOn
                              ? "bg-[#5F5CD9] text-white"
                              : "bg-[#2B2A29] hover:bg-[#3B3A39] text-slate-200"
                          }`}
                        >
                          {isAudioPreviewOn
                            ? "🔊 Micro actif"
                            : "🎧 Tester micro"}
                        </button>

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
                          <div
                            key={msg._id || i}
                            className="bg-[#2B2A29] p-2 rounded border border-[#3B3A39]"
                          >
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="font-bold text-[#A6A7DC]">
                                {msg.sender}
                              </span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <p className="text-slate-200 text-xs break-words">
                              {msg.text}
                            </p>
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
              </div>
            )}
          </div>
        )}

        {activeTab === "auth" && (
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-[#0D1432] shadow-[0_40px_120px_-35px_rgba(30,38,78,0.8)] md:flex-row">
              <div className="relative flex-1 bg-gradient-to-b from-[#3743A8] via-[#4B59D8] to-[#171C36] p-8 text-white">
                <div className="absolute -right-24 top-8 h-40 w-40 rounded-full bg-[#5F5CD9]/20 blur-3xl" />
                <div className="absolute left-10 top-24 h-28 w-28 rounded-full bg-[#8C88FF]/15 blur-3xl" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div>
                    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.4em] text-slate-200 shadow-sm">
                      Mode Teams
                    </span>
                    <h2 className="mt-6 text-3xl font-semibold leading-tight text-white">
                      Connexion à votre espace équipe
                    </h2>
                    <p className="mt-4 max-w-sm text-sm text-slate-200/80">
                      Un tableau de bord collaboratif avec réunions, chat et
                      agenda synchronisés.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <div className="h-10 w-10 rounded-3xl bg-[#B1B4FF]/20 flex items-center justify-center text-xl text-white">
                        💬
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Discussions instantanées
                        </p>
                        <p className="text-[12px] text-slate-300">
                          Restez connecté avec votre équipe.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <div className="h-10 w-10 rounded-3xl bg-[#B1B4FF]/20 flex items-center justify-center text-xl text-white">
                        📅
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Agenda intelligent
                        </p>
                        <p className="text-[12px] text-slate-300">
                          Planifiez vos réunions en un clin d'œil.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <div className="h-10 w-10 rounded-3xl bg-[#B1B4FF]/20 flex items-center justify-center text-xl text-white">
                        📹
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Appels immersifs
                        </p>
                        <p className="text-[12px] text-slate-300">
                          Rejoignez rapidement vos réunions vidéo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex w-full max-w-md flex-col justify-center bg-[#0F162B] p-8 shadow-inner md:max-w-sm">
                <div className="absolute inset-x-6 top-6 h-16 rounded-[24px] bg-gradient-to-r from-[#5F5CD9]/20 via-[#2A72FF]/15 to-[#5F5CD9]/20 blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Bienvenue
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      Connectez-vous
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Utilisez vos identifiants pour accéder à l’espace Teams.
                    </p>
                  </div>

                  <div className="grid gap-2 rounded-[24px] border border-[#2B3C72] bg-[#111A34]/60 p-4">
                    <button
                      onClick={() => setIsRegisterMode(false)}
                      type="button"
                      className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${
                        !isRegisterMode
                          ? "bg-[#5F5CD9] text-white shadow-lg"
                          : "bg-[#14204A] text-slate-300 hover:bg-[#1E2A5D]"
                      }`}
                    >
                      Connexion
                    </button>
                    <button
                      onClick={() => setIsRegisterMode(true)}
                      type="button"
                      className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${
                        isRegisterMode
                          ? "bg-[#5F5CD9] text-white shadow-lg"
                          : "bg-[#14204A] text-slate-300 hover:bg-[#1E2A5D]"
                      }`}
                    >
                      Inscription
                    </button>
                  </div>

                  {user ? (
                    <div className="space-y-4 rounded-[24px] border border-[#2B3C72] bg-[#111A34]/80 p-5 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4C57D7] text-2xl text-white shadow-lg">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {user.username}
                      </p>
                      <p className="text-[13px] text-slate-400">
                        Vous êtes connecté avec succès.
                      </p>
                      <button
                        onClick={() => setUser(null)}
                        className="w-full rounded-3xl bg-[#E74C3C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#FF5F5F]"
                      >
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                      {authError && (
                        <div className="rounded-3xl border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-200">
                          {authError}
                        </div>
                      )}
                      <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="w-full rounded-3xl border border-[#2B3C72] bg-[#0F162B] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5F5CD9]"
                      />
                      <label className="block text-xs uppercase tracking-[0.3em] text-slate-400">
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-3xl border border-[#2B3C72] bg-[#0F162B] px-4 py-3 text-sm text-white outline-none transition focus:border-[#5F5CD9]"
                      />
                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
                      >
                        {isAuthLoading
                          ? "Chargement..."
                          : isRegisterMode
                          ? "Créer un compte"
                          : "Se connecter"}
                      </button>
                      <p className="text-center text-[12px] text-slate-500">
                        En continuant, vous acceptez les conditions
                        d'utilisation.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}