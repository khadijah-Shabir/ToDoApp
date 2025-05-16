export interface Task{
  id?:       string;
  title:     string;
  description: string;
  date:      string;
  startTime: string;
  endTime:   string;
  notes:     string;
  completed: boolean;
}