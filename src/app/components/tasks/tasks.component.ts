import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { TodoListComponent } from './todo-list/todo-list.component';
import { TodoCreateComponent } from './todo-create/todo-create.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule,RouterModule,TodoListComponent,TodoCreateComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent  {
  private router = inject(Router);
  public authService = inject(AuthService);

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}