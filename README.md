<div align="center">
  <h3 align="center">Hackulus Web — Frontend</h3>

  <p align="center">
    Next.js frontend for the Hackulus hackathon portal (FastAPI backend)
  </p>
</div>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the project locally](#running-the-project-locally)
- [Testing mobile layouts](#testing-mobile-layouts)
- [License](#license)

## About The Project

This repository contains the frontend for the Hackulus hackathon portal — a distinct, reworked version of the original Hackulus'25 frontend, rebuilt to run against the FastAPI backend (`hackulus26-be` / see the `backend-fixes` branch of this repo).

It provides the full UI for the hackathon workflow: participant dashboard, track & problem-statement selection (Review 0), review submissions, judge panels & scoring, admin management, leaderboard, and a live event timeline.

*Key Features:*

- Server-side rendering with *Next.js*
- API interactions with the *FastAPI* backend (JWT auth, role-based routing for participants / judges / admins)
- Client-side state management, routing, authentication
- Framer Motion animations, fully responsive layout (mobile drawer nav, stacked cards, scrolling tables)

## Built With

This project is built using the following technologies and frameworks:

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/) (backend, in the `backend-fixes` branch of this repo)

## Getting Started

To run a local copy of the frontend, follow these steps.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm
- [Python](https://www.python.org/) 3.12+ for the backend
- The FastAPI backend running locally — see *Backend setup* below

## Installation

1. Clone the repo
   ```sh
   git clone https://github.com/vishaltantri/hack-web.git
   ```

2. Navigate into the project directory and check out the frontend branch
   ```sh
   cd hack-web
   git checkout main        # frontend lives on main
   ```

3. Install dependencies
   ```sh
   npm install
   ```

## Backend setup (FastAPI)

The backend lives on the `backend-fixes` branch of this repository (FastAPI + SQLAlchemy + SQLite for local dev).

```sh
git checkout backend-fixes -- hackulus26-be   # or clone the branch into a separate folder
cd hackulus26-be
python3 -m venv venv
venv/bin/pip install -r requirements.txt aiosqlite

# create + seed the SQLite database (hashed demo credentials)
venv/bin/python setup_db.py

# start the API on http://localhost:8000
venv/bin/uvicorn app.main:app --port 8000
```

Seeded demo logins (passwords are bcrypt-hashed by the seed script):

| Role        | Email                          | Password              |
| ----------- | ------------------------------ | --------------------- |
| Admin       | `admin@vitstudent.ac.in`       | `Mann309`             |
| Judge       | `judge1@vitstudent.ac.in`      | `BhaiYeKyaHoRahaHai`  |
| Participant | `leader.alpha@vitstudent.ac.in`| `24BCE0001` (reg. no) |

Interactive API docs: http://localhost:8000/docs

## Running the project locally

```sh
npm run dev
```

Runs the app in development mode (Next.js dev server).
Open http://localhost:3000 to view it in the browser.

Build & run for production:
```sh
npm run build
npm start
```

The frontend talks to the backend at `http://localhost:8000` (set via `NEXT_PUBLIC_API_BASE_URL` in `.env.local`; a mock backend can be enabled with `NEXT_PUBLIC_MOCK_BACKEND=true`).

## Testing mobile layouts

The UI is fully responsive (hamburger timeline drawer, stacked cards, scrolling tables below `md`). To check a layout at phone size:

1. Open Chrome/Edge DevTools → `Ctrl+Shift+M` (device toolbar) and pick a device such as **iPhone 14** (390px), or
2. Simply drag the browser window below `768px` and reload.

## License

Distributed under the MIT License. See LICENSE for more information.
