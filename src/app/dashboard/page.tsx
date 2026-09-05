"use client";

import withAuth from "@/components/auth/withAuth";
import ProjectModifyForm from "@/components/project-forms/project-modify-form";
import ProjectSubmissionForm from "@/components/project-forms/project-submission-form";
import Timeline from "@/components/timeline";
import TrackModal from "@/components/track-modal";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { trackinfo, tracks } from "@/lib/data";
import { AnimatePresence, easeOut, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Star,
  Edit2,
  User,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
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
  track_name: string;
}

interface Submission {
  submission_id: number;
  type: "review1" | "review2" | "final";
  title: string;
  description: string;
  links?: {
    presentation_link?: string;
    github_link?: string;
    figma_link?: string;
    file?: string;
  };
}

interface DashboardData {
  user: {
    user_id: number;
    name: string;
    is_leader: boolean;
  };
  team: Team;
  members: Member[];
  windows: {
    review1: boolean;
    review2: boolean;
    final: boolean;
  };
  currentPhase: string;
}

// Map track names to their specific accent colors for the Figma design
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
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<(typeof trackinfo)[0] | null>(null);
  const [isProjectSubmitModalOpen, setIsProjectSubmitModalOpen] = useState(false);
  const [isProjectModifyModalOpen, setIsProjectModifyModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const getCurrentReviewStage = () => {
    if (dashboardData?.windows?.final) return "Final Review";
    if (dashboardData?.windows?.review2) return "Review 2";
    if (dashboardData?.windows?.review1) return "Review 1";
    return "";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, submissionsRes] = await Promise.all([
          api.get("/users/home"),
          api.get("/submissions/"),
        ]);
        setDashboardData(homeRes.data);
        setSubmissions(submissionsRes.data.submissions);
      } catch (error) {
        const errorMessage =
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.response?.data?.message || "Failed to load dashboard.";
        toast.error(errorMessage);
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const existingIdeaSubmission = useMemo(
    () => submissions.find((s) => s.type === "review1"),
    [submissions]
  );

  const submissionForCurrentPhase = useMemo(() => {
    if (!dashboardData?.currentPhase) return null;
    if (dashboardData.currentPhase === "Review 2")
      return submissions.find((s) => s.type === "review2");
    if (dashboardData.currentPhase === "Final Review")
      return submissions.find((s) => s.type === "final");
    return null;
  }, [submissions, dashboardData?.currentPhase]);

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
    const { windows } = dashboardData || {};
    const { currentPhase } = dashboardData || {};
    if (windows?.review1) {
      return {
        text: existingIdeaSubmission ? "Modify Idea" : "Submit Idea",
        action: "idea",
      };
    }
    if (currentPhase === "Review 2" && windows?.review2) {
      return {
        text: submissionForCurrentPhase ? "Modify Project" : "Submit Project",
        action: "review2",
      };
    }
    if (currentPhase === "Final Review" && windows?.final) {
      return {
        text: submissionForCurrentPhase ? "Modify Project" : "Submit Project",
        action: "final",
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
      case "idea": {
        const route = existingIdeaSubmission ? "/idea-modification" : "/idea-submission";
        router.push(route);
        break;
      }
      case "review2":
      case "final":
        if (submissionForCurrentPhase) {
          setIsProjectModifyModalOpen(true);
        } else {
          setIsProjectSubmitModalOpen(true);
        }
        break;
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
            
            {dashboardData?.currentPhase && (
              <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-[#F67C1B]/50 shadow-sm text-[#11152B] font-bold">
                <Star className="w-4 h-4 text-[#F67C1B] fill-current" />
                <span>{dashboardData.currentPhase} Phase</span>
              </div>
            )}
          </div>

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
                <button className="text-white/40 hover:text-white/80 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="flex gap-6 h-full">
                {/* Left side: Icon and Tagline */}
                <div className="w-[45%] flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-b from-[#1E254A] to-[#151932] shadow-inner flex items-center justify-center mb-6 relative border border-white/5">
                    {/* Simplified Team Graphic matching the Figma vibe */}
                    <div className="absolute top-4 w-12 h-12 bg-[#F67C1B] rounded-full left-1/2 -translate-x-1/2"></div>
                    <div className="absolute bottom-6 w-20 h-10 bg-[#F67C1B] rounded-t-full left-1/2 -translate-x-1/2"></div>
                    <div className="absolute -bottom-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#F67C1B] font-bold text-lg shadow-md border-2 border-[#151932]">
                      ?
                    </div>
                  </div>
                  <h4 className="text-white/90 font-bold text-sm leading-snug tracking-wider mb-4 px-4 uppercase">
                    The Squad That Makes It Happen!
                  </h4>
                  <div className="px-3 py-1.5 border border-[#F67C1B] rounded-md">
                    <span className="text-[#F67C1B] text-[10px] font-bold uppercase tracking-wider">
                      {dashboardData?.team?.track_name || "No Track"}
                    </span>
                  </div>
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
                    <h2 className="text-white text-4xl font-bold leading-[1.1] mb-6">
                      Turn your ideas<br />into reality
                    </h2>

                    {existingIdeaSubmission && (
                      <div className="w-max mb-6">
                        <div className="flex items-center gap-2 bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/40 px-4 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                          <CheckCircle2 className="w-4 h-4 fill-current text-[#151932]" />
                          Idea Submitted!
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleButtonClick}
                      disabled={buttonState.action === "closed"}
                      className="group relative flex items-center justify-between w-[220px] bg-gradient-to-r from-[#FF512F] to-[#F09819] hover:from-[#F09819] hover:to-[#FF512F] text-white font-bold text-lg px-6 py-7 rounded-full shadow-[0_8px_20px_rgba(246,124,27,0.3)] hover:shadow-[0_12px_25px_rgba(246,124,27,0.4)] transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <span>{buttonState.text}</span>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                         <ArrowRight className="w-4 h-4 text-[#F67C1B] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Button>
                    {buttonState.action === "closed" && (
                      <span className="text-white/40 text-xs mt-3 block">Submissions are currently closed.</span>
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
                        src={track.logo}
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
                submissionType={getButtonState().action as "review2" | "final"}
              />
            </div>
          </>
        )}
      </AnimatePresence>

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
                submissionType={submissionForCurrentPhase.type as "review2" | "final"}
              />
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default withAuth(Dashboard);
