import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../models/task.model';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading: boolean = true;
  filterStatus: string = 'all';
  sortField: string = 'date';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedTask: Task | null = null;
  
  private taskService = inject(TaskService);
  private router = inject(Router);

  ngOnInit(): void {
    // Subscribe to task updates
    this.taskService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
      this.applyFilters();
    });
    
    // Subscribe to loading status
    this.taskService.loading$.subscribe(loading => {
      this.loading = loading;
    });
    
    // Initial load
    this.taskService.loadTasks();
  }

  // Apply filters and sorting
  applyFilters(): void {
    // Apply status filter
    if (this.filterStatus === 'all') {
      this.filteredTasks = [...this.tasks];
    } else {
      const isCompleted = this.filterStatus === 'completed';
      this.filteredTasks = this.tasks.filter(task => task.completed === isCompleted);
    }
  }
  
  // Navigate to create new task
  createTask(): void {
    this.router.navigate(['/tasks/create']);
  }
  
  // Navigate to edit task
  editTask(task: Task): void {
    this.router.navigate(['/tasks/create'], { 
      queryParams: { id: task.id } 
    });
  }
  
  // Delete task
  deleteTask(task: Task, event: Event): void {
    event.stopPropagation(); // Prevent row click event
    
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => console.log('Task deleted successfully'),
        error: (err) => console.error('Error deleting task:', err)
      });
    }
  }
  
  // Toggle task completion
  toggleCompletion(task: Task, event: Event): void {
    event.stopPropagation(); // Prevent row click event
    
    this.taskService.toggleTaskCompletion(task).subscribe({
      next: () => console.log('Task updated successfully'),
      error: (err) => console.error('Error updating task:', err)
    });
  }
  
  // Change filter status
  changeFilter(status: string): void {
    this.filterStatus = status;
    
    if (status === 'all') {
      this.taskService.filterByCompletion(null);
    } else {
      this.taskService.filterByCompletion(status === 'completed');
    }
  }
  
  // Change sort field and direction
  changeSort(field: string): void {
    if (this.sortField === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Default to ascending for new field
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.taskService.sortTasks(this.sortField, this.sortDirection);
  }
  
  // Show task details modal
  showTaskDetails(task: Task): void {
    this.selectedTask = task;
  }
  
  // Close task details modal
  closeTaskDetails(): void {
    this.selectedTask = null;
  }
  
  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}