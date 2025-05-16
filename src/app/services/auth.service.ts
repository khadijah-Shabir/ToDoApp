import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

// Firebase imports
import { FirebaseApp, initializeApp } from 'firebase/app';
import { 
  Auth, 
  GoogleAuthProvider, 
  User, 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';

import { firebaseConfig } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app: FirebaseApp;
  private auth: Auth;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();
  
  private router = inject(Router);

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    
    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
    });
  }

  // Sign in with Google
  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Error logging in with Google:', error);
      throw error;
    }
  }

  // Sign out
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  // Get current user ID
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}