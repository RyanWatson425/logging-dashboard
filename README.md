# Logging Dashboard

A web application for observing and visualizing system logs from Apple's Unified Logging System. This full-stack application provides a modern interface for developers to troubleshoot application, kernel, or hardware-level issues on macOS.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Go 1.26.2
- **Data Source**: Apple Unified Logging System (queried directly from macOS)

## Features

- **Infinite scroll pagination** for seamless log browsing
- **Resizable columns** with persistence in localStorage
- **Search functionality** across log messages, categories, processes, and subsystems
- **Filter by log level** (Info, Error, Default, Debug)
- **Filter by subsystem** to isolate specific system components
- **Direct OS log querying** from your machine's operating system

## Prerequisites

- **macOS operating system** (required for Apple Unified Logging System access)
- **Go 1.26.2** - [download here](https://go.dev/dl/)
- **Node.js and npm** - [download here](https://nodejs.org/)

## Local Development Setup

### Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Build the Go binary:

   ```bash
   go build
   ```

3. Run the backend server:
   ```bash
   ./logging-dashboard
   ```

The backend will start on `localhost:8080`.

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend/logging-dashboard-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `localhost:5173`.

### Running Both Services is Required

## Project Structure

```
logging-dashboard/
├── backend/
│   ├── api/          # HTTP API handlers
│   ├── service/      # Business logic and log processing
│   ├── utils/        # Utility functions for log fetching
│   └── main.go       # Backend entry point
└── frontend/
    └── logging-dashboard-frontend/
        ├── src/      # React components and application logic
        └── package.json
```

## Additional Information

This application is designed for **local development only** and is not intended for production deployment. It provides developers with an easier way to analyze logging data from their macOS system.

## License

See LICENSE file for details.
