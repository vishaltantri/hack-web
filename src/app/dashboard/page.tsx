"use client";

import withAuth from "@/components/auth/withAuth";
import ProjectModifyForm from "@/components/project-forms/project-modify-form";
import ProjectSubmissionForm from "@/components/project-forms/project-submission-form";
import Review0Modal from "@/components/project-forms/review0-modal";
import LeaderboardModal from "@/components/leaderboard-modal";
import Timeline from "@/components/timeline";
import TrackModal from "@/components/track-modal";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { trackinfo, tracks as defaultTracks } from "@/lib/data";
import { AnimatePresence, easeOut, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Star,
  Edit2,
  User,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Trophy,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface Member {
  user_id: number;
  name: string;
  email: string;
  is_leader: boolean;
}

interface Team {
  team_id: number;
  team_name: string;
  track_id?: number;
  track_name?: string;
  problem_statement_id?: number;
  problem_statement?: {
    id: number;
    title: string;
    description: string;
  } | null;
  status: string;
  is_eliminated?: boolean;
}

interface Submission {
  submission_id: number;
  type: string;
  title?: string;
  description?: string;
  links?: Record<string, string>;
  status?: string;
}

interface DashboardData {
  user: {
    user_id: number;
    name: string;
    email: string;
    role: string;
    is_leader: boolean;
  };
  team: Team | null;
  members: Member[];
  windows: {
    review0?: boolean;
    review1?: boolean;
    review2?: boolean;
  };
  currentPhase: string;
}

// Map track names to their specific accent colors
const trackColors: Record<string, string> = {
  "AI and Mathematical Modelling": "#7C3AED", // Purple
  "Cyber Security": "#2563EB", // Blue
  "FinTech": "#16A34A", // Green
  "Healthcare": "#9333EA", // Purple
  "VIT-Centric": "#EA580C", // Orange
  "Open Innovation": "#DC2626", // Red
  "Sustainability": "#16A34A", // Green
};

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<(typeof trackinfo)[0] | null>(null);
  const [isReview0ModalOpen, setIsReview0ModalOpen] = useState(false);
  const [isProjectSubmitModalOpen, setIsProjectSubmitModalOpen] = useState(false);
  const [isProjectModifyModalOpen, setIsProjectModifyModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tracks, setTracks] = useState<typeof defaultTracks>(defaultTracks);

  const fetchDashboardData = async () => {
    try {
      const [homeRes, submissionsRes, tracksRes] = await Promise.all([
        api.get("/users/home"),
        api.get("/users/submissions").catch(() => api.get("/submissions/")),
        api.get("/teams/tracks").catch(() => ({ data: defaultTracks })),
      ]);
      setDashboardData(homeRes.data);
      setSubmissions(submissionsRes.data.submissions || []);
      if (Array.isArray(tracksRes.data) && tracksRes.data.length > 0) {
        setTracks(tracksRes.data);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any)?.response?.data?.message || "Failed to load dashboard.";
      toast.error(errorMessage);
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const existingReview1Submission = useMemo(
    () => submissions.find((s) => s.type === "review1"),
    [submissions]
  );

  const existingReview2Submission = useMemo(
    () => submissions.find((s) => s.type === "review2" || s.type === "final"),
    [submissions]
  );

  const submissionForCurrentPhase = useMemo(() => {
    if (dashboardData?.windows?.review2) return existingReview2Submission || null;
    if (dashboardData?.windows?.review1) return existingReview1Submission || null;
    return null;
  }, [dashboardData?.windows, existingReview1Submission, existingReview2Submission]);

  const getCurrentReviewStage = () => {
    if (dashboardData?.windows?.review2) return "Final Review (Review 2)";
    if (dashboardData?.windows?.review1) return "Review 1";
    if (dashboardData?.windows?.review0) return "Review 0";
    return dashboardData?.currentPhase || "";
  };

  const isEliminated = useMemo(() => {
    return dashboardData?.team?.status?.toLowerCase() === "rejected" || !!dashboardData?.team?.is_eliminated;
  }, [dashboardData?.team]);

  const handleTrackClick = (trackName: string) => {
    const trackData = trackinfo.find((t) => t.name === trackName);
    if (trackData) {
      setSelectedTrack(trackData);
      setIsModalOpen(true);
    }
  };

  const sortedMembers = useMemo(() => {
    if (!dashboardData?.members) return [];
    return [...dashboardData.members].sort((a, b) => {
      if (a.is_leader) return -1;
      if (b.is_leader) return 1;
      return 0;
    });
  }, [dashboardData?.members]);

  const getButtonState = () => {
    if (isEliminated) {
      return { text: "Team Eliminated", action: "eliminated" };
    }

    const { windows } = dashboardData || {};
    if (windows?.review0) {
      const hasPs = !!dashboardData?.team?.problem_statement_id;
      return {
        text: hasPs ? "Review 0: Change PS" : "Review 0: Select PS",
        action: "review0",
      };
    }
    if (windows?.review1) {
      return {
        text: existingReview1Submission ? "Modify Review 1" : "Submit Review 1",
        action: "review1",
      };
    }
    if (windows?.review2) {
      return {
        text: existingReview2Submission ? "Modify Final Project" : "Submit Final Project",
        action: "review2",
      };
    }
    return { text: "Submissions Closed", action: "closed" };
  };

  const handleButtonClick = () => {
    if (!user?.is_leader) {
      toast.error("Only the team leader can perform this action.");
      return;
    }
    const { action } = getButtonState();
    switch (action) {
      case "review0": {
        setIsReview0ModalOpen(true);
        break;
      }
      case "review1": {
        if (existingReview1Submission) {
          setIsProjectModifyModalOpen(true);
        } else {
          setIsProjectSubmitModalOpen(true);
        }
        break;
      }
      case "review2": {
        if (existingReview2Submission) {
          setIsProjectModifyModalOpen(true);
        } else {
          setIsProjectSubmitModalOpen(true);
        }
        break;
      }
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F67C1B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const buttonState = getButtonState();
  const currentPhase = dashboardData?.currentPhase || "Participants reach";


  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F6F7FA] text-[#11152B] font-sans">
      
      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <Timeline currentPhase={currentPhase} teamName={dashboardData?.team?.team_name} />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden flex flex-col h-screen">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-8 right-8 grid grid-cols-4 gap-2 opacity-50 pointer-events-none z-0">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? "bg-[#F67C1B]" : "bg-gray-300"}`}
            ></div>
          ))}
        </div>
        
        <div className="absolute -bottom-32 -left-10 w-full h-[300px] pointer-events-none z-0 opacity-80 flex">
           {/* Abstract wavy bottom shapes simulated with large overlapping circles */}
           <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#11152B] to-[#1C254C] absolute -bottom-[600px] -left-[200px]"></div>
           <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#FF512F] to-[#F09819] absolute -bottom-[450px] left-[150px] opacity-90"></div>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex-1 overflow-y-auto p-10 pb-20">
          
          {/* ── HEADER ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                Hi, {user?.name || "User"}
              </h1>
              <p className="text-gray-500 font-medium">
                We&apos;re in the {currentPhase} phase • Let&apos;s build something awesome!
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsLeaderboardModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#11152B] border-gray-200 rounded-full px-5 py-2 font-bold shadow-sm h-auto transition-transform hover:scale-105"
              >
                <Trophy className="w-4 h-4 text-[#F67C1B]" />
                <span>Leaderboard</span>
              </Button>

              {dashboardData?.currentPhase && (
                <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-[#F67C1B]/50 shadow-sm text-[#11152B] font-bold">
                  <Star className="w-4 h-4 text-[#F67C1B] fill-current" />
                  <span>{dashboardData.currentPhase} Phase</span>
                </div>
              )}
            </div>
          </div>

          {/* ── ELIMINATED BANNER ───────────────────────────────────────── */}
          {isEliminated && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-700 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <strong className="font-bold text-red-800">Team Eliminated:</strong> Your team was eliminated during Review 1 evaluations. Further project submissions are locked.
              </div>
            </div>
          )}

          {/* ── TOP BENTO CARDS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6 mb-10 h-[380px]">
            
            {/* 1. Team Card */}
            <div className="bg-[#151932] rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden border border-white/5">
              {/* Decorative dots top-left */}
              <div className="absolute top-6 left-6 grid grid-cols-2 gap-1.5 opacity-30">
                {[...Array(4)].map((_, i) => (
                   <div key={i} className={`w-1 h-1 rounded-full ${i===0?"bg-[#F67C1B]":"bg-white"}`}></div>
                ))}
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-8 pl-12">
                <div className="flex items-center gap-2">
                  <span className="text-[#F67C1B] font-black text-xl italic">/</span>
                  <h3 className="text-white text-xl font-bold tracking-wide">
                    {dashboardData?.team?.team_name || "Your Team"}
                  </h3>
                </div>
                {dashboardData?.windows?.review0 && user?.is_leader && (
                  <button
                    onClick={() => setIsReview0ModalOpen(true)}
                    className="text-white/60 hover:text-[#F67C1B] transition-colors flex items-center gap-1.5 text-xs bg-white/5 px-2.5 py-1 rounded-full border border-white/10"
                    title="Change Track & Problem Statement"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change PS</span>
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="flex gap-6 h-full">
                {/* Left side: Icon and Tagline */}
                <div className="w-[45%] flex flex-col items-center justify-center text-center">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1E254A] to-[#151932] shadow-inner flex items-center justify-center mb-4 relative border border-white/5">
                    {/* Simplified Team Graphic matching the Figma vibe */}
                    <div className="absolute top-3 w-10 h-10 bg-[#F67C1B] rounded-full left-1/2 -translate-x-1/2"></div>
                    <div className="absolute bottom-5 w-16 h-8 bg-[#F67C1B] rounded-t-full left-1/2 -translate-x-1/2"></div>
                    <div className="absolute -bottom-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-[#F67C1B] font-bold text-base shadow-md border-2 border-[#151932]">
                      ?
                    </div>
                  </div>
                  <h4 className="text-white/90 font-bold text-xs leading-snug tracking-wider mb-2 px-2 uppercase">
                    The Squad That Makes It Happen!
                  </h4>
                  <div className="px-3 py-1 border border-[#F67C1B] rounded-md mb-1">
                    <span className="text-[#F67C1B] text-[10px] font-bold uppercase tracking-wider">
                      {dashboardData?.team?.track_name || "No Track Selected"}
                    </span>
                  </div>
                  {dashboardData?.team?.problem_statement?.title && (
                    <p className="text-white/70 text-[11px] leading-tight line-clamp-2 px-1 italic">
                      PS: {dashboardData.team.problem_statement.title}
                    </p>
                  )}
                </div>

                {/* Right side: Member list */}
                <div className="w-[55%] space-y-2">
                  {sortedMembers.length > 0 ? (
                    sortedMembers.map((member) => {
                      const isCurrentUser = member.user_id === user?.user_id;
                      return (
                        <div
                          key={member.user_id}
                          className="bg-[#1C213F] rounded-xl p-3 px-4 flex items-center justify-between border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-white/50 bg-white/5 p-1.5 rounded-full">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-white text-sm font-semibold">
                              {member.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {isCurrentUser && (
                              <div className="bg-[#F67C1B] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-[#F67C1B]/50">
                                You
                              </div>
                            )}
                            <div className="flex gap-1 opacity-20">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-white/50 text-sm italic">No team members yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CTA Card */}
            <div className="bg-[#151932] rounded-3xl p-8 shadow-xl relative overflow-hidden border border-white/5">
               {/* Left glowing background effect */}
               <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
               <div className="absolute left-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-[#F67C1B]/20 rounded-full blur-[60px]"></div>
               
               <div className="flex h-full items-center relative z-10">
                 {/* Left Graphic */}
                 <div className="w-1/2 flex items-center justify-center relative">
                    {/* Simulated Graphic using Lucide for now to match the vibe, or images if exact SVGs exist */}
                    <div className="relative">
                      <Image
                         src="/vector12.svg" // Contains the rocket/laptop generic vector
                         alt="Submission graphic"
                         width={220}
                         height={220}
                         className="opacity-90 object-contain drop-shadow-2xl"
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(246,124,27,0.8)]">
                         <Lightbulb className="w-24 h-24 text-[#F67C1B] fill-[#F67C1B]/20" strokeWidth={1} />
                      </div>
                    </div>
                 </div>

                 {/* Right Content */}
                 <div className="w-1/2 pl-6 flex flex-col justify-center">
                    <h2 className="text-white text-4xl font-bold leading-[1.1] mb-4">
                      Turn your ideas<br />into reality
                    </h2>

                    {/* Status badges */}
                    <div className="space-y-1.5 mb-4">
                      {dashboardData?.team?.problem_statement_id && (
                        <div className="w-max">
                          <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full font-bold text-xs">
                            <Lock className="w-3 h-3" />
                            Track & PS Locked
                          </div>
                        </div>
                      )}
                      {existingReview1Submission && (
                        <div className="w-max">
                          <div className="flex items-center gap-1.5 bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/40 px-3 py-1 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                            <CheckCircle2 className="w-3 h-3 fill-current text-[#151932]" />
                            Review 1 Submitted
                          </div>
                        </div>
                      )}
                      {existingReview2Submission && (
                        <div className="w-max">
                          <div className="flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full font-bold text-xs">
                            <CheckCircle2 className="w-3 h-3 fill-current text-[#151932]" />
                            Final Project Submitted
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleButtonClick}
                      disabled={buttonState.action === "closed" || buttonState.action === "eliminated"}
                      className="group relative flex items-center justify-between w-[240px] bg-gradient-to-r from-[#FF512F] to-[#F09819] hover:from-[#F09819] hover:to-[#FF512F] text-white font-bold text-base px-6 py-6 rounded-full shadow-[0_8px_20px_rgba(246,124,27,0.3)] hover:shadow-[0_12px_25px_rgba(246,124,27,0.4)] transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <span>{buttonState.text}</span>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                         <ArrowRight className="w-4 h-4 text-[#F67C1B] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Button>
                    {(buttonState.action === "closed" || buttonState.action === "eliminated") && (
                      <span className="text-white/40 text-xs mt-2 block">
                        {buttonState.action === "eliminated"
                          ? "Eliminated teams cannot submit."
                          : "Submissions are currently closed."}
                      </span>
                    )}
                 </div>
               </div>
            </div>

          </div>

          {/* ── TRACKS GRID ─────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-6">
               <span className="text-[#F67C1B] font-black text-2xl italic">/</span>
               <h2 className="text-2xl font-bold tracking-wide text-[#11152B] uppercase">Tracks</h2>
            </div>
            
            <div className="flex justify-between gap-4">
              {tracks.map((track) => {
                const detail = trackinfo.find((t) => t.name === track.name);
                const dt = defaultTracks.find((t) => t.name === track.name);
                const logo = track.logo || dt?.logo || "/ai.webp";
                const psCount = detail?.problem_statements.length ?? 0;
                const accentColor = trackColors[track.name] || "#11152B";

                return (
                  <div
                    key={track.name}
                    onClick={() => handleTrackClick(track.name)}
                    className="flex-1 bg-white rounded-2xl p-5 pt-8 pb-6 flex flex-col items-center justify-between cursor-pointer border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 relative group h-[220px]"
                  >
                    {/* PS Count Badge */}
                    <div 
                      className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md z-10"
                      style={{ backgroundColor: accentColor }}
                    >
                      {psCount}
                    </div>

                    <div className="flex-1 flex items-center justify-center w-full relative">
                      {/* Subtle hover background glow */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full blur-xl scale-75"
                        style={{ backgroundColor: accentColor }}
                      />
                      <Image
                        src={logo}
                        alt={track.name}
                        width={90}
                        height={90}
                        className="object-contain group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-sm invert opacity-80 group-hover:opacity-100"
                      />
                    </div>
                    
                    <p className="text-center font-bold text-sm leading-tight text-[#11152B] mt-4 max-w-[120px]">
                      {track.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-[#11152B]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: easeOut, duration: 0.3 }}
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedTrack(null);
              }}
            >
              {selectedTrack && (
                <TrackModal
                  trackData={selectedTrack}
                  onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTrack(null);
                  }}
                />
              )}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── REVIEW 0 MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isReview0ModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-[#11152B]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: easeOut, duration: 0.3 }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Review0Modal
                onClose={() => setIsReview0ModalOpen(false)}
                onSuccess={fetchDashboardData}
                currentTrackId={dashboardData?.team?.track_id}
                currentProblemStatementId={dashboardData?.team?.problem_statement_id}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── LEADERBOARD MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isLeaderboardModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-[#11152B]/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: easeOut, duration: 0.3 }}
              onClick={() => setIsLeaderboardModalOpen(false)}
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setIsLeaderboardModalOpen(false)}
            >
              <LeaderboardModal onClose={() => setIsLeaderboardModalOpen(false)} />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── PROJECT SUBMISSION MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {isProjectSubmitModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-[#11152B]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: easeOut, duration: 0.3 }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <ProjectSubmissionForm
                reviewStage={getCurrentReviewStage()}
                onClose={() => setIsProjectSubmitModalOpen(false)}
                onSuccess={fetchDashboardData}
                submissionType={dashboardData?.windows?.review2 ? "review2" : "review1"}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── PROJECT MODIFY MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isProjectModifyModalOpen && submissionForCurrentPhase && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-[#11152B]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: easeOut, duration: 0.3 }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <ProjectModifyForm
                reviewStage={getCurrentReviewStage()}
                submission={submissionForCurrentPhase}
                onClose={() => setIsProjectModifyModalOpen(false)}
                onSuccess={fetchDashboardData}
                submissionType={
                  (submissionForCurrentPhase.type === "review2" || submissionForCurrentPhase.type === "final"
                    ? "review2"
                    : "review1") as "review1" | "review2" | "final"
                }
              />
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default withAuth(Dashboard);
