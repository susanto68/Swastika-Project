# Time Genius

A modern, mobile-first timetable planner inspired by IEM Kolkata routine pages and student dashboard apps. It is built with plain HTML, CSS, and JavaScript, stores everything in LocalStorage, and works without a backend.

## Features

- Weekly Monday to Friday timetable grid
- Add, edit, delete, and drag timetable blocks
- Color-coded subjects with room and faculty details
- Clash detection with red highlighting
- Today's schedule and current class card
- Student profile personalization
- Dark mode and light mode
- Attendance tracker
- Exam and assignment reminders
- Mini calendar widget
- Pomodoro-style study timer
- Weekly study-hours analytics
- AI-style timetable suggestions
- Download timetable as PNG or PDF
- Print-friendly routine
- PWA manifest and service worker for offline support

## Project Structure

```text
.
├── assets/
│   └── college-mark.svg
├── icons/
│   ├── icon.svg
│   └── maskable-icon.svg
├── index.html
├── style.css
├── script.js
├── manifest.json
├── service-worker.js
└── README.md
```

## Run Locally

Open `index.html` in a browser, or run a small static server:

```bash
npx serve .
```

## Deploy To Vercel

1. Push this folder to a GitHub repository.
2. Open Vercel and choose **Add New Project**.
3. Import `https://github.com/susanto68/Swastika-Project`.
4. Keep the framework preset as **Other**.
5. Leave the build command empty.
6. Set the output directory to `.`.
7. Deploy.

Direct import link:

```text
https://vercel.com/new/clone?repository-url=https://github.com/susanto68/Swastika-Project
```

## Notes For Beginners

- Timetable data is saved in the browser using LocalStorage.
- No database or backend is required.
- The app can be customized by editing `script.js` for default classes and `style.css` for visual design.
- PWA offline support works best after serving the site over `http://localhost`, Vercel, or another HTTPS host.
