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
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.tasksSubject.next([]);
      return;
    }

    this.loadingSubject.next(true);

    // Create a query against the collection
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(
      tasksRef, 
      where("userId", "==", userId),
      orderBy(sortField, sortDirection)
    );

    // Execute the query
    getDocs(q)
      .then((querySnapshot: QuerySnapshot<DocumentData>) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Task, 'id'>;
          tasks.push({ ...data, id: doc.id });
        });
        this.tasksSubject.next(tasks);
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
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error("User not authenticated"));
    }

    // Add userId to the task
    const taskWithUser = { ...task, userId };

    return from(addDoc(collection(this.firestore, 'tasks'), taskWithUser)).pipe(
      map(docRef => {
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
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.tasksSubject.next([]);
      return;
    }

    this.loadingSubject.next(true);

    let q;
    const tasksRef = collection(this.firestore, 'tasks');
    
    if (showCompleted === null) {
      // Show all tasks
      q = query(tasksRef, where("userId", "==", userId));
    } else {
      // Filter by completion status
      q = query(
        tasksRef, 
        where("userId", "==", userId),
        where("completed", "==", showCompleted)
      );
    }

    // Execute the query
    getDocs(q)
      .then((querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Task, 'id'>;
          tasks.push({ ...data, id: doc.id });
        });
        this.tasksSubject.next(tasks);
        this.loadingSubject.next(false);
      })
      .catch(error => {
        console.error("Error filtering tasks:", error);
        this.loadingSubject.next(false);
      });
  }
}