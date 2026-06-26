'use client';

import GanttChart from '@/components/tasks/GanttChart';

export default function GanttPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gantt Chart</h1>
        <p className="text-muted-foreground">
          Visualize project timeline with task hierarchy, dependencies, and drag-and-drop scheduling
        </p>
      </div>

      <GanttChart />
    </div>
  );
}
