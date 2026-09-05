"use client";

import withAdminAuth from "@/components/auth/withAdminAuth";
import Timeline from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Search, Edit2, AlertCircle } from "lucide-react";

export interface Member {
  member_id: number;
  name: string;
  email: string;
  is_leader: boolean;
}

export interface Team {
  team_id: number;
  team_name: string;
  track_name: string;
  status: string;
  members: Member[];
  problem_statement: string;
  idea: string;
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

interface TeamDetails extends Team {
  submissions: Submission[];
}

interface Review {
  judge_id: number;
  innovation_score: number;
  technical_complexity_score: number;
  completeness_score: number;
  presentation_score: number;
  scalability_score: number;
  impact_score: number;
  comments: string;
}

const hackathonPhases = [
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

// Matches backend ReviewCreateUpdate schema — 6 categories, 0–100 each
const scoringCategories = [
  { key: "innovation_score", label: "Innovation" },
  { key: "technical_complexity_score", label: "Technical Complexity" },
  { key: "completeness_score", label: "Completeness" },
  { key: "presentation_score", label: "Presentation" },
  { key: "scalability_score", label: "Scalability" },
  { key: "impact_score", label: "Impact" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamDetails, setSelectedTeamDetails] =
    useState<TeamDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [timelinePhase, setTimelinePhase] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [teamToEliminate, setTeamToEliminate] = useState<number | null>(null);
  const [isEliminationModalOpen, setIsEliminationModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previousReview, setPreviousReview] = useState<Review | null>(null);

  const activeTeams = useMemo(
    () => teams.filter((team) => team.status.toLowerCase() !== "rejected"),
    [teams]
  );

  const currentTotalScore = useMemo(() => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  }, [scores]);

  const latestSubmission = useMemo(() => {
    if (!selectedTeamDetails) return null;
    return (
      selectedTeamDetails.submissions.find((s) => s.type === "final") ||
      selectedTeamDetails.submissions.find((s) => s.type === "review2") ||
      selectedTeamDetails.submissions.find((s) => s.type === "review1") ||
      null
    );
  }, [selectedTeamDetails]);

  const filteredTeams = useMemo(
    () =>
      teams.filter((team) =>
        team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [teams, searchTerm]
  );

  const fetchTeams = async () => {
    try {
      const response = await api.get("/admin/teams");
      setTeams(response.data.teams);
    } catch (error) {
      toast.error("Failed to refresh teams list.");
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [teamsRes, timelineRes] = await Promise.all([
          api.get("/admin/teams"),
          api.get("/admin/timeline/phase"),
        ]);
        setTeams(teamsRes.data.teams || []);
        setTimelinePhase(timelineRes.data.currentPhase || "");
      } catch (error) {
        toast.error("Failed to fetch initial admin data.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      setIsDetailsLoading(true);
      setSelectedTeamDetails(null);
      setPreviousReview(null);
      setScores({});
      setComments("");
      api
        .get(`/admin/team/${selectedTeam.team_id}`)
        .then((response) => {
          const { team, members, submissions } = response.data;
          const details = { ...team, members: members || team.members, submissions: submissions || team.submissions };
          setSelectedTeamDetails(details);
          const latestSub =
            details.submissions.find(
              (s: { type: string }) => s.type === "final"
            ) ||
            details.submissions.find(
              (s: { type: string }) => s.type === "review2"
            ) ||
            details.submissions.find(
              (s: { type: string }) => s.type === "review1"
            );
          if (latestSub) {
            api
              .get(`/admin/submission/${latestSub.submission_id}`)
              .then((res) => {
                const currentUserReview = (res.data.reviews || []).find(
                  (review: Review) => review.judge_id === user?.user_id
                );
                if (currentUserReview) {
                  setPreviousReview(currentUserReview);
                  setComments(currentUserReview.comments || "");
                  // Pre-fill scores from previous review
                  const prevScores: Record<string, number> = {};
                  for (const cat of scoringCategories) {
                    const val = currentUserReview[cat.key as keyof Review];
                    if (typeof val === "number") prevScores[cat.key] = val;
                  }
                  setScores(prevScores);
                }
              });
          }
        })
        .catch((error) => {
          toast.error("Failed to fetch team details.");
          console.error(error);
        })
        .finally(() => {
          setIsDetailsLoading(false);
        });
    }
  }, [selectedTeam, user]);

  const handleTimelineUpdate = async () => {
    try {
      await api.post("/admin/timeline/phase", { phase: timelinePhase });
      toast.success(`Timeline has been updated to: ${timelinePhase}`);
    } catch (error) {
      toast.error("Failed to update timeline. You must be a Super Admin.");
      console.error(error);
    }
  };

  const handleEliminateConfirm = async () => {
    if (!teamToEliminate) {
      toast.error("No team selected for elimination.");
      return;
    }

    try {
      await api.post(`/admin/team/${teamToEliminate}/status`, {
        status: "rejected",
      });
      const teamName =
        teams.find((t) => t.team_id === teamToEliminate)?.team_name ||
        "The team";
      toast.success(`${teamName} has been eliminated.`);

      fetchTeams();
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
          "Failed to eliminate team. You may not have permission."
      );
    } finally {
      setIsEliminationModalOpen(false);
      setTeamToEliminate(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTeamLeader = (team: Team) => {
    return team.members.find((member) => member.is_leader)?.name || "N/A";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F67C1B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleScoreChange = (categoryKey: string, value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      setScores((prev) => ({ ...prev, [categoryKey]: numericValue }));
    } else if (value === "") {
      setScores((prev) => {
        const newScores = { ...prev };
        delete newScores[categoryKey];
        return newScores;
      });
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const latestSub = selectedTeamDetails?.submissions?.[0];

    if (!selectedTeam || !latestSub) {
      toast.error("Please select a team with a submission to judge.");
      return;
    }

    // Build payload matching backend ReviewCreateUpdate schema
    const payload = {
      submission_id: latestSub.submission_id,
      team_id: selectedTeam.team_id,
      innovation_score: scores["innovation_score"] || 0,
      technical_complexity_score: scores["technical_complexity_score"] || 0,
      completeness_score: scores["completeness_score"] || 0,
      presentation_score: scores["presentation_score"] || 0,
      scalability_score: scores["scalability_score"] || 0,
      impact_score: scores["impact_score"] || 0,
      comments: comments,
    };

    try {
      // Backend route: POST /reviews/submission/{submission_id}
      await api.post(
        `/reviews/submission/${latestSub.submission_id}`,
        payload
      );
      toast.success(
        `Review submitted for ${selectedTeam.team_name} (Total: ${currentTotalScore})`
      );
      setSelectedTeam(null);
      setSelectedTeamDetails(null);
    } catch (error) {
      toast.error(
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).response?.data?.detail || "Failed to submit review."
      );
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F6F7FA] text-[#11152B] font-sans">
      
      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <Timeline currentPhase={timelinePhase || "Participants reach"} teamName="Admin Panel" />

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
           <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#11152B] to-[#1C254C] absolute -bottom-[600px] -left-[200px]"></div>
           <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#FF512F] to-[#F09819] absolute -bottom-[450px] left-[150px] opacity-90"></div>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex-1 overflow-y-auto p-10 pb-20">
          
          {/* ── HEADER ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                Hi, {user?.name || "Admin"}
              </h1>
              <p className="text-gray-500 font-medium">
                Manage the Hackulus&apos;25 event • All systems operational
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-green-500/50 shadow-sm text-[#11152B] font-bold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Admin Mode</span>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-8 relative z-20">
            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-8">
              
              {/* Teams Table Card */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F67C1B] font-black text-xl italic">/</span>
                    <h3 className="text-[#11152B] text-xl font-bold tracking-wide">
                      Participating Teams
                    </h3>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search for a team..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-10 pl-9 rounded-full bg-gray-50 border-gray-200 text-sm focus-visible:ring-[#F67C1B]"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                      <tr className="text-gray-500">
                        <th className="py-3 px-4 font-semibold rounded-tl-xl">S.No</th>
                        <th className="py-3 px-4 font-semibold">Team Name</th>
                        <th className="py-3 px-4 font-semibold">Track</th>
                        <th className="py-3 px-4 font-semibold rounded-tr-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTeams.map((team, index) => {
                        const isRejected = team.status.toLowerCase() === "rejected";
                        const isSelected = selectedTeam?.team_id === team.team_id;

                        return (
                          <tr
                            key={team.team_id}
                            onClick={() => !isRejected && setSelectedTeam(team)}
                            className={`group transition-colors ${
                              isRejected
                                ? "opacity-50 bg-red-50"
                                : isSelected
                                ? "bg-[#F67C1B]/10 cursor-pointer"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                          >
                            <td className="py-3 px-4 text-gray-400 font-medium">{index + 1}</td>
                            <td className="py-3 px-4 font-semibold text-[#11152B]">
                              {team.team_name}
                            </td>
                            <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]">
                              {team.track_name}
                            </td>
                            <td className="py-3 px-4 capitalize font-medium">
                              {isRejected ? (
                                <span className="text-red-500">{team.status}</span>
                              ) : (
                                <span className={
                                  team.status === "accepted" ? "text-green-500" 
                                  : team.status === "shortlisted" ? "text-purple-500" 
                                  : "text-blue-500"
                                }>
                                  {team.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline Control Card */}
              <div className="bg-[#151932] rounded-3xl p-8 shadow-xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F67C1B]/10 rounded-full blur-[40px] pointer-events-none"></div>
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <span className="text-[#F67C1B] font-black text-xl italic">/</span>
                  <h3 className="text-white text-xl font-bold tracking-wide">
                    Timeline Control
                  </h3>
                </div>
                <p className="text-white/60 text-sm mb-6 relative z-10">
                  Select the current active phase of the hackathon.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <Select value={timelinePhase} onValueChange={setTimelinePhase}>
                    <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white focus:ring-[#F67C1B]">
                      <SelectValue placeholder="Select a phase" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151932] border-white/20 text-white">
                      {hackathonPhases.map((phase) => (
                        <SelectItem key={phase} value={phase} className="focus:bg-white/10 focus:text-white">
                          {phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleTimelineUpdate}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#FF512F] to-[#F09819] hover:from-[#F09819] hover:to-[#FF512F] text-white font-bold h-12 px-8 rounded-xl shadow-[0_4px_15px_rgba(246,124,27,0.3)] hover:shadow-[0_6px_20px_rgba(246,124,27,0.4)] transition-all"
                  >
                    Confirm
                  </Button>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-8">
              
              {/* Judging Panel Card */}
              <div className="bg-[#151932] rounded-3xl p-8 shadow-xl border border-white/5 relative overflow-hidden">
                {/* Glowing bg effects */}
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#F67C1B] font-black text-xl italic">/</span>
                      <h3 className="text-white text-xl font-bold tracking-wide">
                        Judging Panel
                      </h3>
                    </div>
                    {selectedTeam ? (
                      <p className="text-white/80 font-medium">
                        Judging: <span className="text-white font-bold">{selectedTeam.team_name}</span>
                      </p>
                    ) : (
                      <p className="text-white/50 text-sm">Select a team to begin judging</p>
                    )}
                  </div>

                  {selectedTeam && (
                    <div className="text-right">
                       <div className="text-sm text-white/50 mb-1">Total Score</div>
                       <div className="text-3xl font-black text-[#F67C1B]">{currentTotalScore}</div>
                    </div>
                  )}
                </div>

                {selectedTeam ? (
                  <form onSubmit={handleScoreSubmit} className="relative z-10">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                      {scoringCategories.map((category) => (
                        <div key={category.key}>
                          <label className="text-white/80 text-xs font-semibold block mb-1.5 uppercase tracking-wider">
                            {category.label} <span className="text-white/40">(0-100)</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={scores[category.key] ?? ""}
                            onChange={(e) => handleScoreChange(category.key, e.target.value)}
                            className="h-10 bg-white/5 border-white/10 text-white focus-visible:ring-[#F67C1B] rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-8">
                      <label className="text-white/80 text-xs font-semibold block mb-1.5 uppercase tracking-wider">
                        Comments
                      </label>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide feedback for the team..."
                        className="bg-white/5 border-white/10 text-white focus-visible:ring-[#F67C1B] rounded-xl resize-none h-24"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedTeam(null)}
                        className="flex-1 border-white/20 text-white hover:bg-white/10 h-12 rounded-xl"
                      >
                        Clear Selection
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-[#FF512F] to-[#F09819] hover:from-[#F09819] hover:to-[#FF512F] text-white font-bold h-12 rounded-xl shadow-[0_4px_15px_rgba(246,124,27,0.3)] transition-all"
                      >
                        Submit Score
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-60 border-2 border-dashed border-white/10 rounded-2xl">
                    <Edit2 className="w-12 h-12 text-white/30 mb-4" />
                    <p className="text-white text-sm">Select a team from the table on the left<br/>to grade their submission.</p>
                  </div>
                )}
              </div>

              {/* Project Details Card */}
              {selectedTeam && (
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[#F67C1B] font-black text-xl italic">/</span>
                    <h3 className="text-[#11152B] text-xl font-bold tracking-wide">
                      Project Details
                    </h3>
                  </div>

                  {isDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-3 border-[#F67C1B] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">Track</label>
                           <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-medium text-gray-800">
                             {selectedTeamDetails?.track_name || "N/A"}
                           </div>
                        </div>
                        <div>
                           <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">Idea Title</label>
                           <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-medium text-gray-800 truncate">
                             {latestSubmission?.title || "N/A"}
                           </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">Description</label>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm text-gray-700 min-h-[80px]">
                           {latestSubmission?.description || "No description provided."}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2">
                        {['github_link', 'figma_link', 'presentation_link'].map((key) => {
                          const val = latestSubmission?.links?.[key as keyof typeof latestSubmission.links];
                          const name = key.split('_')[0];
                          return (
                            <a
                              key={key}
                              href={val && val !== "N/A" ? val : "#"}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                val && val !== "N/A" 
                                ? "bg-white border-[#F67C1B]/30 hover:border-[#F67C1B] hover:shadow-md text-[#11152B]" 
                                : "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <span className="capitalize text-xs font-bold">{name}</span>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Elimination Zone */}
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-red-900 text-lg font-bold tracking-wide">
                    Danger Zone
                  </h3>
                </div>
                <p className="text-red-700/70 text-sm mb-4">
                   Permanently eliminate a team from Hackulus&apos;25.
                </p>

                <div className="flex gap-4">
                  <Select onValueChange={(value) => setTeamToEliminate(Number(value))}>
                    <SelectTrigger className="flex-1 h-12 bg-white border-red-200 text-red-900 focus:ring-red-500">
                      <SelectValue placeholder="Select team to eliminate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTeams.map((team) => (
                        <SelectItem key={team.team_id} value={String(team.team_id)} className="text-red-900 focus:bg-red-50">
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => teamToEliminate && setIsEliminationModalOpen(true)}
                    disabled={!teamToEliminate}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-6 rounded-xl transition-all"
                  >
                    Eliminate
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── ELIMINATION MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEliminationModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-[#11152B]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white border border-gray-100"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                   <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-center text-[#11152B] mb-2">
                  Confirm Elimination
                </h2>
                <p className="text-center text-gray-500 text-sm mb-8">
                  Are you absolutely sure you want to eliminate <br/><strong className="text-[#11152B]">&ldquo;{teams.find((t) => t.team_id === teamToEliminate)?.team_name}&rdquo;</strong>?<br/>This action cannot be reversed.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEliminationModalOpen(false)}
                    className="flex-1 h-12 rounded-xl text-gray-600 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEliminateConfirm}
                    className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    Yes, Eliminate
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default withAdminAuth(AdminDashboard);
