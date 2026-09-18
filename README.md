<p align="center"><img src="https://imgur.com/Vp4LWt0.png" width=160 title="SIAM-VIT" alt="SIAM-VIT"></p>
<div align="center">
  <h3 align="center">Hackulus'25 Frontend</h3>

  <p align="center">
    <a href="https://github.com/orgs/SIAM-VIT/repositories?q=hackulus"><strong>Explore other Hackulus repositories</strong></a>
    <br />
    <br />
    <a href="https://github.com/SIAM-VIT/hackulus25-fe/issues">Report Bug</a>
    ·
    <a href="https://hackulus.siamvit.com">Live Deployment</a>
  </p>
</div>


## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [License](#license)


## About The Project

This repository is the official frontend for *Hackulus'25*, SIAM-VIT’s flagship hackathon.  
The frontend is built using *Next.js + React*, and works with the backend to provide UI for tracks, submissions, admins, authentication, and other hackathon workflows.

*Key Features:*

- Server-side rendering with *Next.js*  
- API interactions to the Express backend  
- Client side state management, routing, authentication  
- Framer motion for animations

## Built With

This project is built using the following technologies and frameworks:

- [Next.js](https://nextjs.org/)  
- [React](https://reactjs.org/)  
- [TypeScript](https://www.typescriptlang.org/)  
- [TailwindCSS](https://tailwindcss.com/)  

## Getting Started

To run a local copy of the frontend, follow these steps.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)  
- npm  
- Access to the backend (running or hosted) with its base URL (https://hackulus25-be-express.onrender.com)  

## Installation

1. Clone the repo  
   ```sh
   git clone https://github.com/SIAM-VIT/hackulus25-fe.git

2. Navigate into the project directory
   ```sh
   cd hackulus25-fe

3. Install dependencies
   ```sh
   npm install

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

## Testing mobile layouts

The UI is fully responsive (hamburger timeline drawer, stacked cards, scrolling tables below `md`). To check a layout at phone size:

1. Open Chrome/Edge DevTools → `Ctrl+Shift+M` (device toolbar) and pick a device such as **iPhone 14** (390px), or
2. Simply drag the browser window below `768px` and reload.

The backend must be running (see the `Hackulus_26_BE`/backend README) for pages beyond the landing/login screens to render data.

## License

Distributed under the MIT License. See LICENSE for more information.

