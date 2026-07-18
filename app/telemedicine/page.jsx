"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

export default function TelemedicinePage() {
  const [meetingId, setMeetingId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const startMeeting = () => {
    if (!meetingId.trim()) return;
    setIsJoined(true);
  };

  const generateMeeting = () => {
    const id = `medibot-${Math.random().toString(36).substring(2, 8)}`;
    setMeetingId(id);
    setIsJoined(true);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black">📹 Telemedicine</h1>
          <p className="text-slate-400 text-sm">Secure video consultations with your healthcare provider</p>
        </div>

        {!isJoined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-dark rounded-2xl p-6 border border-sky-500/20">
              <h2 className="font-bold text-lg mb-2">Join a Consultation</h2>
              <p className="text-slate-400 text-sm mb-6">Enter the meeting ID provided by your doctor.</p>
              
              <div className="space-y-4">
                <input 
                  className="input-field" 
                  placeholder="Meeting ID (e.g. medibot-xyz)" 
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                />
                <button 
                  onClick={startMeeting}
                  disabled={!meetingId.trim()} 
                  className="btn-primary w-full"
                >
                  Join Meeting
                </button>
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-2">Start a New Call</h2>
              <p className="text-slate-400 text-sm mb-6">Create a new secure meeting room to share with your patient.</p>
              
              <button onClick={generateMeeting} className="btn-secondary w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
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
              <button onClick={() => setIsJoined(false)} className="btn-secondary text-xs px-3 py-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
                End Call
              </button>
            </div>
            <div className="w-full h-[600px] bg-black rounded-xl overflow-hidden">
              <iframe
                src={`https://meet.jit.si/${meetingId}`}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
