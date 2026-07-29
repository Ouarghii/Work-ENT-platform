"use client";

import React from "react";

export interface ZoomClientProps {
  meetingId: string;
  passcode: string;
  userName: string;
  signature: string;
  sdkKey: string;
}

export default function ZoomClient({
  meetingId,
  passcode,
  userName,
  signature,
  sdkKey,
}: ZoomClientProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4">
      <p className="font-semibold text-sm">Zoom Session Joined</p>
      <p className="text-xs text-slate-400">Meeting ID: {meetingId}</p>
      <p className="text-xs text-slate-400">User: {userName}</p>
    </div>
  );
}