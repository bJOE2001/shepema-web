# Shepema Web 🐑📖

> Official landing page & web showcase for **Shepema — Your Devotional Buddy | Scripture Reader & Prayer Journal**.

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation Guide](#installation-guide)
- [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Building for Production & Deployment](#building-for-production--deployment)
- [Linting & Code Quality](#linting--code-quality)
- [License](#license)

---

## 🌟 About The Project

**Shepema** is a personal devotional buddy app designed for Christians to cultivate a consistent daily walk with God. This repository contains the modern, responsive web landing page showcasing features such as:
- **R.R.M.A. Method**: Read, Reflect, Meditate, Apply devotional journaling.
- **KJV Bible Reader**: Built-in Scripture reader with offline capabilities.
- **Streak & Habit Tracking**: Daily devotion tracking and milestones.
- **Shareable Verse Cards**: Aesthetic verse card generator.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler / Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Design System, CSS Variables, Glassmorphism)
- **Linter**: [Oxlint](https://oxc.rs/)
- **Typography**: Google Fonts (*Playfair Display*, *Lora*, *Caveat*)

---

## 📦 Prerequisites

Before installing, ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` or `v22.x LTS`)
- **Package Manager**: `npm` (bundled with Node.js), `pnpm`, `yarn`, or `bun`
- **Git**: (Optional, for cloning repository)

To verify your Node.js and npm versions, run:
```bash
node -v
npm -v
```

---

## 🚀 Installation Guide

Follow these steps to get your development environment set up:

### 1. Clone or Download the Repository

Using Git:
```bash
git clone https://github.com/your-username/shepema-web.git
cd shepema-web
```

Or if you already have the repository extracted locally:
```bash
cd path/to/shepema-web
```

### 2. Install Dependencies

Run one of the following commands in the project root directory:

**Using npm:**
```bash
npm install
```

**Using pnpm:**
```bash
pnpm install
```

**Using yarn:**
```bash
yarn install
```

**Using bun:**
```bash
bun install
```

---

## 💻 Running Locally

Start the Vite local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Once started, open your browser and navigate to:
```
http://localhost:5173
```

*(If port `5173` is in use, Vite will automatically select the next available port, e.g., `http://localhost:5174`)*

---

## 📜 Available Scripts

In the project root, you can run the following commands:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with hot reload |
| `npm run build` | Builds and bundles production-ready static assets into the `dist/` directory |
| `npm run preview` | Locally previews the production build output from `dist/` |
| `npm run lint` | Runs Oxlint to check code quality and catch syntax issues |

---

## 📁 Project Structure

```text
shepema-web/
├── public/                  # Static public assets (images, logos, mascots, icons)
│   ├── images/              # App screenshots, mascots, badges
│   └── favicon.ico
├── src/                     # React source code
│   ├── components/          # Reusable UI sections & components
│   │   ├── About.jsx        # About Shepema section
│   │   ├── DownloadCTA.jsx  # Call-to-action download banner
│   │   ├── Features.jsx     # App feature highlights (R.R.M.A, KJV Bible, etc.)
│   │   ├── Footer.jsx       # Footer links & copyright
│   │   ├── Hero.jsx         # Hero header banner with CTA buttons
│   │   ├── HowItWorks.jsx   # 4-step R.R.M.A workflow guide
│   │   ├── Navbar.jsx       # Responsive navigation bar
│   │   └── Screenshots.jsx  # Interactive UI screenshot carousel/gallery
│   ├── hooks/               # Custom React hooks
│   ├── styles/              # Global CSS stylesheets & design variables
│   ├── App.jsx              # Main page assembly
│   ├── App.css              # App-level layout styles
│   └── main.jsx             # React DOM root entrypoint
├── defringe.py              # Utility script for asset image processing
├── index.html               # Main HTML template (metadata, Google Fonts)
├── package.json             # Project dependencies and npm scripts
├── vite.config.js           # Vite build and plugin configurations
└── README.md                # Project documentation & installation guide
```

---

## 🏗️ Building for Production & Deployment

### 1. Create a Production Build

To compile and minify the app into static files:
```bash
npm run build
```
This generates a standalone `dist/` folder containing HTML, CSS, JavaScript, and asset files.

### 2. Preview the Build

Before deploying, test the production bundle locally:
```bash
npm run preview
```

### 3. Deploying

- **Vercel / Netlify**: Connect your GitHub repository. Set the build command to `npm run build` and publish directory to `dist`.
- **Apache / XAMPP**: Place or copy the contents of the `dist/` folder into `htdocs/` (or configure a VirtualHost pointing to `dist`).
- **GitHub Pages**: Build the project and deploy the `dist/` folder using `gh-pages` or GitHub Actions.

---

## 🧹 Linting & Code Quality

This project uses [Oxlint](https://oxc.rs/) for fast JavaScript and React linting.

To run the linter:
```bash
npm run lint
```

---

## 📄 License

This project is proprietary and all rights are reserved unless otherwise stated.
