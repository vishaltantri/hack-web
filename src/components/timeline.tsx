"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Lightbulb,
  Star,
  Utensils,
  Mic,
  UtensilsCrossed,
  Code,
  Trophy,
  Power,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

const HACKATHON_PHASES = [
  "Participants Reach",
  "Ideation",
  "Review 1",
  "Lunch",
  "Speaker Sessions",
  "Review 2",
  "Dinner",
  "Begin Hacking",
  "Final Review",
];

const PHASE_ICONS: Record<string, React.ReactNode> = {
  "Participants Reach": <Users className="w-4 h-4" />,
  "Ideation": <Lightbulb className="w-4 h-4" />,
  "Review 1": <Star className="w-4 h-4" />,
  "Lunch": <Utensils className="w-4 h-4" />,
  "Speaker Sessions": <Mic className="w-4 h-4" />,
  "Review 2": <Star className="w-4 h-4" />,
  "Dinner": <UtensilsCrossed className="w-4 h-4" />,
  "Begin Hacking": <Code className="w-4 h-4" />,
  "Final Review": <Trophy className="w-4 h-4" />,
};

interface TimelineProps {
  currentPhase: string;
  teamName?: string;
}

export default function Timeline({ currentPhase, teamName }: TimelineProps) {
  const { logout, user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route/page re-renders with a new phase
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [currentPhase]);

  // Normalize string for matching just in case
  const normalizedCurrentPhase = currentPhase.toLowerCase();
  const currentIndex = HACKATHON_PHASES.findIndex(
    (p) => p.toLowerCase() === normalizedCurrentPhase
  ) === -1 ? 2 : HACKATHON_PHASES.findIndex(
    (p) => p.toLowerCase() === normalizedCurrentPhase
  ); // default to Review 1 for demo if missing

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const currentPhaseLabel = HACKATHON_PHASES[currentIndex] || currentPhase;

  const sidebarBody = (
    <>
      {/* ── LOGO ─────────────────────────────────────────────── */}
      <div className="pt-8 pb-6 flex items-center justify-center border-b border-[#ffffff10]">
        <Image
          src="/final-logo.webp"
          alt="Hackulus Logo"
          width={100}
          height={100}
          className="w-24 h-24 object-contain"
        />
      </div>

      {/* ── TIMELINE HEADER ───────────────────────────────────── */}
      <div className="px-6 py-6 pb-4 flex items-center gap-2">
        <span className="text-[#F67C1B] font-black text-xl italic">/</span>
        <h2 className="text-xl font-bold tracking-wide">Timeline</h2>
        <div className="w-2 h-2 rounded-full bg-[#F67C1B] ml-auto"></div>
      </div>

      {/* ── TIMELINE LIST ─────────────────────────────────────── */}
      <div className="flex-1 px-4 overflow-y-auto space-y-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffffff20] [&::-webkit-scrollbar-thumb]:rounded-full">
        {HACKATHON_PHASES.map((phase, index) => {
          const isCurrent = index === currentIndex;

          return (
            <div
              key={phase}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-[15px] ${
                isCurrent
                  ? "bg-gradient-to-r from-[#FF512F] to-[#F09819] text-white shadow-lg shadow-[#F09819]/20"
                  : "text-[#ffffff80] hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex-shrink-0">
                {PHASE_ICONS[phase]}
              </div>
              <span>{phase}</span>
            </div>
          );
        })}
      </div>

      {/* ── PROFILE & LOGOUT BOTTOM AREA ──────────────────────── */}
      <div className="mt-auto px-6 py-6 pb-8 border-t border-[#ffffff10] bg-[#11152B]">

        {/* Profile Card */}
        <div className="flex items-center justify-between mb-6 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/20 shadow-sm">
              <span className="text-white text-sm font-bold">
                {getInitials(user?.name || "User")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] leading-tight">
                {user?.name || "John Doe"}
              </span>
              <span className="text-[#ffffff70] text-[13px] leading-tight">
                {teamName || "Team Neural Ninjas"}
              </span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-200 text-[#FF512F] text-[15px] font-semibold"
        >
          <Power className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Decorative Dots Pattern (Bottom Left corner in Figma sidebar) */}
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1.5 opacity-20 pointer-events-none">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#F67C1B]"></div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR (hamburger + current phase) ─────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#11152B] text-white flex items-center justify-between px-4 py-3 border-b border-[#ffffff10]">
        <button
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#F67C1B] font-black text-lg italic">/</span>
          <span className="font-bold text-sm tracking-wide truncate">
            {currentPhaseLabel}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/20">
          <span className="text-white text-xs font-bold">
            {getInitials(user?.name || "User")}
          </span>
        </div>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ──────────────────────────────── */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative w-full h-full bg-[#11152B] flex flex-col overflow-hidden text-white border-r border-[#ffffff10]">
          <button
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close menu"
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
          {sidebarBody}
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ─────────────────── */}
      <div className="hidden md:flex w-[18rem] flex-shrink-0 relative flex-col h-full overflow-hidden text-white border-r border-[#ffffff10] bg-[#11152B]">
        {sidebarBody}
      </div>
    </>
  );
}

