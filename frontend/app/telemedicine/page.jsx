"use client";
import { useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function TelemedicinePage() {
  const [meetingId, setMeetingId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const startMeeting = () => {
    if (!meetingId.trim()) return;
    setIsJoined(true);
  };

  const generateMeeting = () => {
    const id = `medibot-room-${Math.random().toString(36).substring(2, 10)}`;
    setMeetingId(id);
    setIsJoined(true);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black">📹 Telemedicine</h1>
          <p className="text-slate-400 text-sm">Secure real-time video consultations</p>
        </div>

        {!isJoined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-dark rounded-2xl p-6 border border-sky-500/20">
              <h2 className="font-bold text-lg mb-2">Join a Consultation</h2>
              <p className="text-slate-400 text-sm mb-6">Enter the meeting ID provided by your doctor.</p>
              
              <div className="space-y-4">
                <input 
                  className="input-field w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white" 
                  placeholder="Meeting ID (e.g. medibot-room-xyz)" 
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                />
                <button 
                  onClick={startMeeting}
                  disabled={!meetingId.trim()} 
                  className="btn-primary w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  Join Meeting
                </button>
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-6 border border-slate-700">
              <h2 className="font-bold text-lg mb-2">Start a New Call</h2>
              <p className="text-slate-400 text-sm mb-6">Create a new secure meeting room to share with your patient.</p>
              
              <button 
                onClick={generateMeeting} 
                className="w-full border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 py-3 rounded-lg font-semibold transition-colors"
              >
                + Create Meeting Link
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-dark rounded-2xl p-2 border border-sky-500/20">
            <div className="flex items-center justify-between p-4 mb-2 bg-slate-900 rounded-xl">
              <div>
                <p className="text-sm font-semibold">Meeting Room: <span className="text-sky-400">{meetingId}</span></p>
                <p className="text-xs text-slate-400">Share this ID with the other participant</p>
              </div>
              <button 
                onClick={() => setIsJoined(false)} 
                className="text-xs px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                End Call
              </button>
            </div>
            
            <div className="w-full h-[650px] bg-black rounded-xl overflow-hidden">
              <JitsiMeeting
                domain="meet.jit.si"
                roomName={meetingId}
                configOverwrite={{
                  startWithAudioMuted: false,
                  disableModeratorIndicator: true,
                  startScreenSharing: false,
                  enableEmailInStats: false,
                }}
                interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                }}
                userInfo={{
                  displayName: "MediBot User"
                }}
                onApiReady={(externalApi) => {
                  console.log("Jitsi API Ready", externalApi);
                }}
                getIFrameRef={(iframeRef) => {
                  iframeRef.style.height = '100%';
                  iframeRef.style.width = '100%';
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
