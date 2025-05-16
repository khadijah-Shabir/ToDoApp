



import { Routes } from '@angular/router';

import { AuthComponent } from './components/auth/auth.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { TodoCreateComponent } from './components/tasks/todo-create/todo-create.component';
import { TodoListComponent } from './components/tasks/todo-list/todo-list.component';

export const routes: Routes = [
  { path: '', component: AuthComponent },
  {
    path: 'tasks',
    component: TasksComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: TodoListComponent },
      { path: 'create', component: TodoCreateComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

