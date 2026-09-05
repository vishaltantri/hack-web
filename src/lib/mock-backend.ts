/**
 * MOCK BACKEND
 * ------------
 * This file intercepts all axios requests and returns realistic dummy data.
 * Activated when NEXT_PUBLIC_MOCK_BACKEND=true is set in .env.local
 *
 * Dummy personas:
 *   - Regular user  → token with role:"user"
 *   - Admin/Judge   → token with role:"judge"
 *
 * Switch between them by calling switchMockUser("admin") or switchMockUser("user")
 * from the browser console.
 */

import MockAdapter from "axios-mock-adapter";
import api from "./api";

// ─── Fake JWT helpers ────────────────────────────────────────────────────────
// We build a minimal, non-signed JWT just so jwtDecode() can read the payload.
const fakeJwt = (payload: object): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
};

const MOCK_USER_TOKEN = fakeJwt({
  user_id: 1,
  email: "john.doe2023@vitstudent.ac.in",
  role: "user",
  team_id: 42,
  is_leader: true,
  name: "John Doe",
  exp: 9999999999,
});

const MOCK_ADMIN_TOKEN = fakeJwt({
  user_id: 99,
  email: "rishab.nagwani2023@vitstudent.ac.in",
  role: "judge",
  team_id: 0,
  is_leader: false,
  name: "Rishab Nagwani",
  exp: 9999999999,
});

// ─── Seed the token so the app starts "logged in" ───────────────────────────
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MOCK_BACKEND === "true") {
  const existing = localStorage.getItem("authToken");
  if (!existing) {
    localStorage.setItem("authToken", MOCK_USER_TOKEN);
  }
}

// Browser console helper to swap personas without page reload
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MOCK_BACKEND === "true") {
  (window as Window & { switchMockUser: (role: "user" | "admin") => void }).switchMockUser = (
    role: "user" | "admin"
  ) => {
    localStorage.setItem(
      "authToken",
      role === "admin" ? MOCK_ADMIN_TOKEN : MOCK_USER_TOKEN
    );
    window.location.reload();
  };
  console.info(
    "%c[MockBackend] Active. Call switchMockUser(\"admin\") or switchMockUser(\"user\") in the console to change personas.",
    "color:#7c3aed;font-weight:bold"
  );
}

// ─── Dummy data ──────────────────────────────────────────────────────────────

const MOCK_USER = {
  user_id: 1,
  name: "John Doe",
  email: "john.doe2023@vitstudent.ac.in",
  role: "user",
  team_id: 42,
  is_leader: true,
};

const MOCK_TEAM = {
  team_id: 42,
  team_name: "Neural Ninjas",
  track_name: "AI and Mathematical Modelling",
  status: "approved",
  problem_statement: "Adaptive Fleet Rerouting in Congested Cities",
  idea: "We propose an adaptive ML-powered system that ingests real-time traffic, weather and historical delivery data to recompute optimal fleet routes. The core model is a Graph Neural Network operating on a live city-road graph.",
};

const MOCK_MEMBERS = [
  {
    user_id: 1,
    member_id: 1,
    name: "John Doe",
    email: "john.doe2023@vitstudent.ac.in",
    is_leader: true,
  },
  {
    user_id: 2,
    member_id: 2,
    name: "Alice Smith",
    email: "alice.smith2023@vitstudent.ac.in",
    is_leader: false,
  },
  {
    user_id: 3,
    member_id: 3,
    name: "Bob Kumar",
    email: "bob.kumar2023@vitstudent.ac.in",
    is_leader: false,
  },
  {
    user_id: 4,
    member_id: 4,
    name: "Priya Sharma",
    email: "priya.sharma2023@vitstudent.ac.in",
    is_leader: false,
  },
];

const MOCK_WINDOWS = {
  review1: true,
  review2: false,
  final: false,
};

const MOCK_SUBMISSIONS = [
  {
    submission_id: 101,
    type: "review1",
    title: "Adaptive Fleet Rerouting in Congested Cities",
    description:
      "An ML-powered adaptive routing system for delivery fleets using real-time traffic data and Graph Neural Networks to reduce fuel consumption by 30% and improve on-time deliveries.",
    links: {
      presentation_link: "https://docs.google.com/presentation/d/mock",
      github_link: "https://github.com/neural-ninjas/fleet-rerouting",
      figma_link: "https://figma.com/file/mock-design",
    },
  },
];

const MOCK_ADMIN_USER = {
  user_id: 99,
  name: "Rishab Nagwani",
  email: "rishab.nagwani2023@vitstudent.ac.in",
  role: "judge",
  team_id: 0,
  is_leader: false,
};

const MOCK_TEAMS_LIST: typeof MOCK_TEAM_DETAILS[] = [];

// Build 12 fake teams for the admin panel
const trackNames = [
  "AI and Mathematical Modelling",
  "Cyber Security",
  "FinTech",
  "Healthcare",
  "VIT-Centric",
  "Open Innovation",
  "Sustainability",
];

const teamNamePrefixes = [
  "Neural", "Cyber", "Quantum", "Pixel", "Alpha", "Sigma",
  "Omega", "Delta", "Vortex", "Phoenix", "Titan", "Nebula",
];
const teamNameSuffixes = [
  "Ninjas", "Hawks", "Force", "Squad", "Crew", "Guild",
  "Pirates", "Wolves", "Coders", "Legends", "Ops", "Surge",
];

interface MockMember {
  member_id: number;
  name: string;
  email: string;
  is_leader: boolean;
}

interface MockSubmission {
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

interface MockReview {
  judge_id: number;
  score: number;
  comments: string;
}

interface MockTeamDetails {
  team_id: number;
  team_name: string;
  track_name: string;
  status: string;
  members: MockMember[];
  problem_statement: string;
  idea: string;
  submissions: MockSubmission[];
  reviews?: MockReview[];
}

const MOCK_TEAM_DETAILS: MockTeamDetails = {
  ...MOCK_TEAM,
  members: MOCK_MEMBERS,
  submissions: MOCK_SUBMISSIONS,
  reviews: [
    {
      judge_id: 99,
      score: 85,
      comments:
        "Strong idea with clear problem understanding. GNN approach is innovative. Work on the demo.",
    },
  ],
};

for (let i = 0; i < 12; i++) {
  MOCK_TEAMS_LIST.push({
    team_id: 42 + i,
    team_name: `${teamNamePrefixes[i]} ${teamNameSuffixes[i]}`,
    track_name: trackNames[i % trackNames.length],
    status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "approved" : "qualified",
    problem_statement: "Sample Problem Statement",
    idea: "This team has a great idea that solves a real-world problem using cutting-edge technology.",
    members: [
      {
        member_id: i * 4 + 1,
        name: `Leader ${i + 1}`,
        email: `leader${i + 1}@vitstudent.ac.in`,
        is_leader: true,
      },
      {
        member_id: i * 4 + 2,
        name: `Member ${i + 1}A`,
        email: `member${i + 1}a@vitstudent.ac.in`,
        is_leader: false,
      },
      {
        member_id: i * 4 + 3,
        name: `Member ${i + 1}B`,
        email: `member${i + 1}b@vitstudent.ac.in`,
        is_leader: false,
      },
    ],
    submissions:
      i % 2 === 0
        ? [
            {
              submission_id: 200 + i,
              type: "review1",
              title: `Team ${i + 1} Idea Submission`,
              description: `An innovative solution by team ${i + 1} addressing real-world challenges.`,
              links: {
                github_link: `https://github.com/team${i + 1}/project`,
                presentation_link: `https://docs.google.com/presentation/d/team${i + 1}`,
              },
            },
          ]
        : [],
    reviews:
      i % 3 === 2
        ? [
            {
              judge_id: 99,
              score: 70 + i * 2,
              comments: `Good work by team ${i + 1}. Solid execution.`,
            },
          ]
        : undefined,
  });
}

// ─── Mount the mock adapter ──────────────────────────────────────────────────

let mockInstance: MockAdapter | null = null;

export function setupMockBackend() {
  if (typeof window === "undefined") return; // SSR: skip
  if (process.env.NEXT_PUBLIC_MOCK_BACKEND !== "true") return; // disabled
  if (mockInstance) return; // already mounted

  const mock = new MockAdapter(api, {
    delayResponse: 400, // realistic ~400ms latency
    onNoMatch: "passthrough",
  });
  mockInstance = mock;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // ── Auth endpoints ──────────────────────────────────────────────────────────

  // User login
  mock.onPost("/auth/user/login").reply(async (config) => {
    await delay(300);
    const body = JSON.parse(config.data || "{}");
    // Accept any email/password in mock mode
    void body;
    return [200, { token: MOCK_USER_TOKEN }];
  });

  // Admin login
  mock.onPost("/auth/admin/login").reply(async (config) => {
    await delay(300);
    void config;
    return [200, { token: MOCK_ADMIN_TOKEN }];
  });

  // Logout
  mock.onPost("/auth/logout").reply(200, { message: "Logged out successfully" });

  // ── User endpoints ──────────────────────────────────────────────────────────

  // Home / dashboard data
  mock.onGet("/users/home").reply(200, {
    user: MOCK_USER,
    team: MOCK_TEAM,
    members: MOCK_MEMBERS,
    windows: MOCK_WINDOWS,
    currentPhase: "Review 1",
  });

  // User's submissions
  mock.onGet("/users/submissions").reply(200, {
    submissions: MOCK_SUBMISSIONS,
  });

  // Idea submission (Review 1)
  mock.onPost("/users/submit/review1").reply(async (config) => {
    await delay(600);
    const body = JSON.parse(config.data || "{}");
    const newSub: MockSubmission = {
      submission_id: 999,
      type: "review1",
      title: body.title || "New Idea",
      description: body.description || "",
      links: body.links,
    };
    MOCK_SUBMISSIONS.splice(0, MOCK_SUBMISSIONS.length, newSub);
    return [201, { message: "Idea submitted successfully", submission: newSub }];
  });

  // Idea modification (Review 1)
  mock.onPut("/users/submit/review1").reply(async (config) => {
    await delay(600);
    const body = JSON.parse(config.data || "{}");
    if (MOCK_SUBMISSIONS[0]) {
      MOCK_SUBMISSIONS[0] = { ...MOCK_SUBMISSIONS[0], ...body };
    }
    return [200, { message: "Idea updated successfully" }];
  });

  // Review 2 submission
  mock.onPost("/users/submit/review2").reply(async (config) => {
    await delay(600);
    const body = JSON.parse(config.data || "{}");
    const newSub: MockSubmission = {
      submission_id: 998,
      type: "review2",
      title: body.title || "Review 2 Project",
      description: body.description || "",
      links: body.links,
    };
    MOCK_SUBMISSIONS.push(newSub);
    return [201, { message: "Review 2 submitted successfully", submission: newSub }];
  });

  mock.onPut("/users/submit/review2").reply(200, { message: "Review 2 updated successfully" });

  // Final submission
  mock.onPost("/users/submit/final").reply(async (config) => {
    await delay(600);
    const body = JSON.parse(config.data || "{}");
    const newSub: MockSubmission = {
      submission_id: 997,
      type: "final",
      title: body.title || "Final Project",
      description: body.description || "",
      links: body.links,
    };
    MOCK_SUBMISSIONS.push(newSub);
    return [201, { message: "Final project submitted successfully", submission: newSub }];
  });

  mock.onPut("/users/submit/final").reply(200, { message: "Final project updated successfully" });

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  // Admin profile
  mock.onGet("/admin/me").reply(200, { user: MOCK_ADMIN_USER });

  // All teams
  mock.onGet("/admin/teams").reply(200, { teams: MOCK_TEAMS_LIST });

  // Single team details
  mock.onGet(/\/admin\/teams\/\d+/).reply((config) => {
    const id = parseInt(config.url?.split("/").pop() || "0", 10);
    const found = MOCK_TEAMS_LIST.find((t) => t.team_id === id);
    if (found) return [200, { team: { ...found, submissions: found.submissions, reviews: found.reviews } }];
    // Fallback to main mock team
    return [200, { team: MOCK_TEAM_DETAILS }];
  });

  // Update team status
  mock.onPatch(/\/admin\/teams\/\d+\/status/).reply((config) => {
    const body = JSON.parse(config.data || "{}");
    const id = parseInt(config.url?.split("/")[3] || "0", 10);
    const team = MOCK_TEAMS_LIST.find((t) => t.team_id === id);
    if (team) team.status = body.status || team.status;
    return [200, { message: "Team status updated" }];
  });

  // Submit review score
  mock.onPost(/\/admin\/teams\/\d+\/review/).reply((config) => {
    const body = JSON.parse(config.data || "{}");
    const id = parseInt(config.url?.split("/")[3] || "0", 10);
    const team = MOCK_TEAMS_LIST.find((t) => t.team_id === id);
    if (team) {
      if (!team.reviews) team.reviews = [];
      team.reviews.push({ judge_id: 99, score: body.score || 0, comments: body.comments || "" });
    }
    return [201, { message: "Review submitted" }];
  });

  // Hackathon phase control
  mock.onGet("/admin/phase").reply(200, { currentPhase: "Review 1" });

  mock.onPost("/admin/phase").reply((config) => {
    const body = JSON.parse(config.data || "{}");
    return [200, { message: "Phase updated", currentPhase: body.phase }];
  });

  // Window controls
  mock.onPost("/admin/windows").reply((config) => {
    const body = JSON.parse(config.data || "{}");
    Object.assign(MOCK_WINDOWS, body);
    return [200, { message: "Windows updated", windows: MOCK_WINDOWS }];
  });

  console.info("[MockBackend] All routes registered ✓");
}
