import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  private router = inject(Router);
  public authService = inject(AuthService);

  ngOnInit() {
    /*  Already authenticated? Skip login screen  */
    this.authService.user$.subscribe(u => { if (u) this.router.navigate(['/tasks']); });
  }

  async loginGoogle() {
    await this.authService.loginWithGoogle();
    this.router.navigate(['/tasks']);
  }
}
