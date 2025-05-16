# Angular Firebase Todo Application

A comprehensive task management application built with Angular and Firebase, featuring user authentication and complete CRUD operations for task management.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Firebase Integration](#firebase-integration)
- [Authentication Flow](#authentication-flow)
- [Data Management](#data-management)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

## Overview

This Todo application allows users to create, read, update, and delete tasks after signing in with Google authentication. The app provides a clean, intuitive interface for effective task management with filtering and sorting capabilities.

## Features

- **User Authentication**: Secure Google authentication via Firebase
- **Task Management**: Full CRUD operations for tasks
- **Filtering**: View all, active, or completed tasks
- **Sorting**: Sort tasks by date or title
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Real-time Updates**: Changes reflect immediately using Firestore

## Technology Stack

- **Frontend**: Angular (Standalone Components)
- **State Management**: RxJS Observables & BehaviorSubjects
- **Backend & Database**: Firebase (Authentication & Firestore)
- **UI Framework**: Bootstrap CSS
- **Form Handling**: Angular Reactive Forms

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── auth/                  # Authentication components
│   │   └── tasks/                 # Task-related components
│   │       ├── todo-create/       # Component for creating/editing tasks
│   │       └── todo-list/         # Component for displaying tasks
│   ├── models/
│   │   └── task.model.ts          # Task interface definition
│   ├── services/
│   │   ├── auth.service.ts        # Firebase authentication service
│   │   └── task.service.ts        # Firestore task operations service
│   ├── app.component.ts           # Root component
│   ├── app.routes.ts              # Application routing
│   └── app.config.ts              # App configuration
└── environment.ts                 # Environment configuration with Firebase keys
```

## Core Components

### Authentication Component
Provides the login interface and handles authentication state. Uses Firebase Google authentication for secure user login.

### Tasks Component
Parent component that hosts the task management interface, including navigation and child components.

### Todo List Component
Displays tasks with sorting and filtering capabilities. Enables marking tasks as complete and includes task details view.

### Todo Create Component
Form interface for creating new tasks and editing existing ones. Built with Angular's reactive forms for robust validation.

## Firebase Integration

The application integrates with Firebase in two key ways:

### Authentication
Firebase Authentication provides secure user management with Google sign-in:

```typescript
// From auth.service.ts
async loginWithGoogle(): Promise<void> {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
}
```

### Firestore Database
Firestore stores and manages task data with real-time updates:

```typescript
// From task.service.ts
addTask(task: Omit<Task, 'id'>): Observable<string> {
  const userId = this.authService.getCurrentUserId();
  const taskWithUser = { ...task, userId };
  return from(addDoc(collection(this.firestore, 'tasks'), taskWithUser)).pipe(
    map(docRef => {
      this.loadTasks();
      return docRef.id;
    })
  );
}
```

## Authentication Flow

1. User clicks the "Sign in with Google" button
2. Firebase authentication popup appears
3. User selects their Google account
4. Upon successful authentication, user is redirected to the tasks page
5. Auth state is maintained in the AuthService and shared via RxJS Observables

## Data Management

Tasks are managed through a service layer that interacts with Firestore:

1. **Create**: New tasks are added to the Firestore 'tasks' collection
2. **Read**: Tasks are retrieved with userId filter to show only the current user's tasks
3. **Update**: Task modifications update the corresponding Firestore document
4. **Delete**: Tasks are permanently removed from Firestore

Task data is presented using RxJS streams:

```typescript
private tasksSubject = new BehaviorSubject<Task[]>([]);
tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
```

## Getting Started

1. Clone the repository
2. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
3. Enable Google Authentication in the Firebase project
4. Create a Firestore database in your Firebase project
5. Update the `environment.ts` file with your Firebase configuration
6. Run `npm install` to install dependencies
7. Run `ng serve` to start the development server

## Firebase Configuration

Update your `environment.ts` file with your Firebase project details:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Deployment

This application can be deployed using Firebase Hosting:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init`
4. Deploy the application: `firebase deploy`

---

Built with Angular and Firebase - Created for efficient task management in modern web applications.
