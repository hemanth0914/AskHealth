# AI Hiring Assistant

This is a full-stack web application that simulates a hiring assistant platform using voice-based interviews and automated agent processing.

## Features

- Voice-based interview assistant (candidate side)
- Recruiter dashboard to view job processing results
- Moderator dashboard to track candidate interview progress
- Multi-agent communication system using FastAPI backend and React frontend

## Frontend

- Built with **ReactJS** and **TailwindCSS**
- Routes include:
  - `/` - Home/Login
  - `/chatbot` - Interviewee voice assistant
  - `/recruiter-dashboard` - Recruiter page (shows jobs and logs)
  - `/moderator-dashboard` - Moderator page (shows resumes and logs)

## Backend

- Built with **FastAPI**
- Serves JSON data from files (`agents.json`, `jobs.json`, `resumes.json`)
- Example endpoints:
  - `GET /api/agents`
  - `GET /api/jobs`
  - `GET /api/resumes`
  - `POST /api/agents/{agent_id}/logs`

## Voice Assistant

- Integrated using Vapi or similar voice API
- Handles candidate responses in real-time
- Returns interview summaries and qualification status

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Make sure Tailwind is properly set up in the frontend.

## Notes

- This app is built for hackathon/demo purposes
- No real authentication implemented (login roles are simulated)
- JSON files act as a temporary database

## Roles

- **Recruiter**: Views job-based logs and outcomes
- **Moderator**: Monitors candidate-wise interview status
- **Interviewee**: Interacts with the AI assistant using voice
