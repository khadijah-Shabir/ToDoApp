import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, from, throwError } from 'rxjs';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';

// Firebase imports
import { FirebaseApp } from 'firebase/app';
import { 
  Firestore, 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  DocumentData,
  QuerySnapshot,
  getDoc
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore: Firestore;
  private authService = inject(AuthService);
  
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() {
    this.firestore = getFirestore();
    this.loadTasks();
    
    // Subscribe to auth changes to reload tasks when user changes
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadTasks();
      } else {
        this.tasksSubject.next([]);
      }
    });
  }

  // Load all tasks for the current user
  loadTasks(sortField: string = 'date', sortDirection: 'asc' | 'desc' = 'asc'): void {
    console.log('Loading tasks with sort field:', sortField, 'direction:', sortDirection);
    const userId = this.authService.getCurrentUserId();
    console.log('User ID for task loading:', userId);
    if (!userId) {
      console.log('No user ID available, returning empty task list');
      this.tasksSubject.next([]);
      return;
    }

    this.loadingSubject.next(true);

    // Create a query against the collection - simplified to avoid index requirements
    const tasksRef = collection(this.firestore, 'tasks');
    // Query only by userId without orderBy to avoid needing a composite index
    const q = query(
      tasksRef, 
      where("userId", "==", userId)
    );
    console.log('Query created for tasks collection with userId filter');

    // Execute the query
    getDocs(q)
      .then((querySnapshot: QuerySnapshot<DocumentData>) => {
        console.log('Query executed, document count:', querySnapshot.size);
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Task, 'id'>;
          tasks.push({ ...data, id: doc.id });
        });
        
        console.log('Raw tasks retrieved:', tasks);
        
        // Sort the tasks in memory instead of in the query
        const sortedTasks = [...tasks].sort((a, b) => {
          if (sortField === 'date') {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortDirection === 'asc' 
              ? dateA.getTime() - dateB.getTime() 
              : dateB.getTime() - dateA.getTime();
          } else if (sortField === 'title') {
            return sortDirection === 'asc'
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title);
          }
          return 0;
        });
        
        console.log('Sorted tasks:', sortedTasks);
        this.tasksSubject.next(sortedTasks);
        this.loadingSubject.next(false);
      })
      .catch(error => {
        console.error("Error loading tasks:", error);
        this.loadingSubject.next(false);
      });
  }

  // Get a single task by ID
  getTask(id: string): Observable<Task | null> {
    return from(getDoc(doc(this.firestore, 'tasks', id))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() as Omit<Task, 'id'> };
        } else {
          return null;
        }
      }),
      catchError(error => {
        console.error("Error getting task:", error);
        return throwError(() => new Error("Error getting task"));
      })
    );
  }

  // Add a new task
  addTask(task: Omit<Task, 'id'>): Observable<string> {
    console.log('Adding new task:', task);
    const userId = this.authService.getCurrentUserId();
    console.log('Current user ID:', userId);
    if (!userId) {
      return throwError(() => new Error("User not authenticated"));
    }

    // Add userId to the task
    const taskWithUser = { ...task, userId };
    console.log('Task with userId added:', taskWithUser);

    return from(addDoc(collection(this.firestore, 'tasks'), taskWithUser)).pipe(
      map(docRef => {
        console.log('Task added successfully with ID:', docRef.id);
        // Refresh task list after adding
        this.loadTasks();
        return docRef.id;
      }),
      catchError(error => {
        console.error("Error adding task:", error);
        return throwError(() => new Error("Error adding task"));
      })
    );
  }

  // Update an existing task
  updateTask(id: string, updates: Partial<Task>): Observable<void> {
    const taskDocRef = doc(this.firestore, 'tasks', id);
    return from(updateDoc(taskDocRef, updates)).pipe(
      map(() => {
        // Refresh task list after updating
        this.loadTasks();
      }),
      catchError(error => {
        console.error("Error updating task:", error);
        return throwError(() => new Error("Error updating task"));
      })
    );
  }

  // Delete a task
  deleteTask(id: string): Observable<void> {
    const taskDocRef = doc(this.firestore, 'tasks', id);
    return from(deleteDoc(taskDocRef)).pipe(
      map(() => {
        // Refresh task list after deleting
        this.loadTasks();
      }),
      catchError(error => {
        console.error("Error deleting task:", error);
        return throwError(() => new Error("Error deleting task"));
      })
    );
  }

  // Toggle task completion status
  toggleTaskCompletion(task: Task): Observable<void> {
    return this.updateTask(task.id!, { completed: !task.completed });
  }

  // Sort tasks
  sortTasks(field: string, direction: 'asc' | 'desc'): void {
    this.loadTasks(field, direction);
  }

  // Filter tasks by completion status
  filterByCompletion(showCompleted: boolean | null = null): void {
    // Reuse our existing loadTasks method and filter in memory
    this.loadingSubject.next(true);
    
    // Get all tasks first
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.tasksSubject.next([]);
      return;
    }

    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(tasksRef, where("userId", "==", userId));
    
    getDocs(q)
      .then((querySnapshot) => {
        const allTasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Task, 'id'>;
          allTasks.push({ ...data, id: doc.id });
        });
        
        // Filter in memory if needed
        let filteredTasks = allTasks;
        if (showCompleted !== null) {
          filteredTasks = allTasks.filter(task => task.completed === showCompleted);
        }
        
        this.tasksSubject.next(filteredTasks);
        this.loadingSubject.next(false);
      })
      .catch(error => {
        console.error("Error filtering tasks:", error);
        this.loadingSubject.next(false);
      });
  }
}