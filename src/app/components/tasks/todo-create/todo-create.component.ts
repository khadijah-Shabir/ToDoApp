import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task } from '../../../models/task.model';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-todo-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './todo-create.component.html',
  styleUrls: ['./todo-create.component.css']
})
export class TodoCreateComponent implements OnInit {
  taskForm!: FormGroup;
  editMode: boolean = false;
  taskId: string | null = null;
  loading: boolean = false;
  submitError: string | null = null;
  
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're editing an existing task
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.taskId = params['id'];
        if (this.taskId) {
        this.loadTaskData(this.taskId);
}
      }
    });
  }

  // Initialize the form
  initForm(): void {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required]],
      date: [today, [Validators.required]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['10:00', [Validators.required]],
      notes: [''],
      completed: [false]
    });
  }
  
  // Load task data for editing
  loadTaskData(taskId: string): void {
    this.loading = true;
    this.taskService.getTask(taskId).subscribe({
      next: (task) => {
        if (task) {
          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            date: task.date,
            startTime: task.startTime,
            endTime: task.endTime,
            notes: task.notes,
            completed: task.completed
          });
        } else {
          this.router.navigate(['/tasks/list']);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading task:', err);
        this.submitError = 'Could not load task data. Please try again.';
        this.loading = false;
      }
    });
  }

  // Submit the form
  onSubmit(): void {
    if (this.taskForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.taskForm.controls).forEach(key => {
        const control = this.taskForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.loading = true;
    const taskData: Task = this.taskForm.value;
    
    if (this.editMode && this.taskId) {
      // Update existing task
      this.taskService.updateTask(this.taskId, taskData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/tasks/list']);
        },
        error: (err) => {
          console.error('Error updating task:', err);
          this.submitError = 'Could not update task. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Create new task
      this.taskService.addTask(taskData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/tasks/list']);
        },
        error: (err) => {
          console.error('Error creating task:', err);
          this.submitError = 'Could not create task. Please try again.';
          this.loading = false;
        }
      });
    }
  }
  
  // Cancel and go back to list
  cancel(): void {
    this.router.navigate(['/tasks/list']);
  }
  
  // Helper for form validation
  isFieldInvalid(fieldName: string): boolean {
    const control = this.taskForm.get(fieldName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }
}