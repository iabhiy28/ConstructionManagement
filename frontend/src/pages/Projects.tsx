import React, { useState, useEffect } from 'react';
import { Project, Task } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  FolderPlus, Calendar, IndianRupee, Layers, CheckCircle2, 
  MapPin, Plus, ArrowRight, User, AlertCircle, Clock, Check
} from 'lucide-react';

interface ProjectsProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onRefreshProjects: () => void;
}

export default function Projects({ projects, selectedProjectId, setSelectedProjectId, onRefreshProjects }: ProjectsProps) {
  const { role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // New Project Form Fields
  const [projName, setProjName] = useState('');
  const [client, setClient] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'Residential' | 'Commercial' | 'Infrastructure' | 'Industrial'>('Commercial');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New Task Form Fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Load tasks for active project
  const loadTasks = async () => {
    if (!selectedProjectId) return;
    setLoadingTasks(true);
    try {
      const data = await api.getTasks(selectedProjectId);
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedProjectId]);

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !budget || !startDate) return;

    try {
      const newProj = await api.createProject({
        name: projName,
        client,
        address,
        type,
        budget: Number(budget),
        start_date: startDate,
        end_date: endDate,
        status: 'Planned'
      });
      setShowAddProject(false);
      // Reset
      setProjName('');
      setClient('');
      setAddress('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      onRefreshProjects();
      setSelectedProjectId(newProj.id);
    } catch (err) {
      alert('Error creating project');
    }
  };

  // Handle Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    try {
      await api.createTask(selectedProjectId, {
        title: taskTitle,
        description: taskDesc,
        status: 'Planned',
        priority: taskPriority,
        due_date: taskDueDate,
        assignee_id: 'u3' // Default assign to site engineer
      });
      setShowAddTask(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('Medium');
      setTaskDueDate('');
      loadTasks();
    } catch (err) {
      alert('Error creating task');
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    try {
      await api.updateTask(taskId, { status: targetStatus });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Quick move fallback (for responsive buttons)
  const moveTaskStatus = async (task: Task, direction: 'forward' | 'backward') => {
    const statuses: Task['status'][] = ['Planned', 'In Progress', 'Blocked', 'Completed'];
    const currentIdx = statuses.indexOf(task.status);
    let nextIdx = direction === 'forward' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < statuses.length) {
      await api.updateTask(task.id, { status: statuses[nextIdx] });
      loadTasks();
    }
  };

  // Columns for Kanban Board
  const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'Planned', label: 'Planned / To-Do', color: 'bg-slate-100 dark:bg-zinc-800/40 text-slate-800 dark:text-slate-300' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400' },
    { id: 'Blocked', label: 'Blocked / Delays', color: 'bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400' },
    { id: 'Completed', label: 'Completed', color: 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400' }
  ];

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Project Planner</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Control timelines, assign tasks, and review milestones for {selectedProject?.name}.</p>
        </div>

        {/* Project additions allowed for Admin/PM */}
        {['Super Admin', 'Company Owner', 'Project Manager'].includes(role) && (
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Add New Site Project
          </button>
        )}
      </div>

      {/* Project Overview Details Panel */}
      {selectedProject && (
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                selectedProject.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' :
                selectedProject.status === 'Delayed' ? 'bg-red-100 dark:bg-red-950/20 text-red-600 animate-pulse' :
                'bg-slate-100 dark:bg-zinc-800 text-muted-foreground'
              }`}>
                {selectedProject.status}
              </span>
              <h3 className="text-base font-extrabold text-foreground">{selectedProject.name}</h3>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{selectedProject.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Budget: ₹{(selectedProject.budget/10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Start: {selectedProject.start_date}</span>
              </div>
            </div>
          </div>

          {/* Progress Tracker Slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Overall Build Progress</span>
              <span>{selectedProject.progress_pct}% Completed</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 rounded-full" 
                style={{ width: `${selectedProject.progress_pct}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Kanban board */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-wide uppercase">Kanban board</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Drag-and-drop tasks to shift progress or use side arrows.</p>
          </div>
          
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primary/15 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>

        {/* Board Columns container */}
        {loadingTasks ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-60 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div 
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="bg-slate-100/50 dark:bg-zinc-900/40 border border-border/80 rounded-2xl p-4 flex flex-col min-h-[400px]"
                >
                  {/* Column Title */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <div className="border border-dashed border-border/75 rounded-xl p-6 text-center text-muted-foreground text-[10px] font-medium mt-4">
                        Drop tasks here
                      </div>
                    ) : (
                      colTasks.map(t => (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          className="bg-white dark:bg-zinc-900 border border-border hover:border-primary/50 rounded-xl p-3.5 shadow-sm space-y-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{t.title}</h4>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                t.priority === 'Critical' ? 'bg-red-100 dark:bg-red-950/20 text-red-600' :
                                t.priority === 'High' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600' :
                                'bg-slate-100 dark:bg-zinc-800 text-muted-foreground'
                              }`}>
                                {t.priority}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">{t.description}</p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-border/50 text-[9px] font-bold text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t.due_date}
                            </span>
                            <div className="flex gap-1">
                              {/* Quick Move Buttons */}
                              {t.status !== 'Planned' && (
                                <button 
                                  onClick={() => moveTaskStatus(t, 'backward')}
                                  className="p-1 hover:bg-muted rounded text-foreground text-[10px]"
                                  title="Move Left"
                                >
                                  ◀
                                </button>
                              )}
                              {t.status !== 'Completed' && (
                                <button 
                                  onClick={() => moveTaskStatus(t, 'forward')}
                                  className="p-1 hover:bg-muted rounded text-foreground text-[10px]"
                                  title="Move Right"
                                >
                                  ▶
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Project Modal Popup */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Initialize Project Site</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Project Title</label>
                  <input
                    type="text" required value={projName} onChange={e => setProjName(e.target.value)}
                    placeholder="e.g. Hitec Residential"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Client Name</label>
                  <input
                    type="text" value={client} onChange={e => setClient(e.target.value)}
                    placeholder="Client agency"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Site Address</label>
                <input
                  type="text" required value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Complete postal address coordinates"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Project Type</label>
                  <select
                    value={type} onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Project Budget (₹)</label>
                  <input
                    type="number" required value={budget} onChange={e => setBudget(e.target.value)}
                    placeholder="Total cash budget"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Start Date</label>
                  <input
                    type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Est. Completion Date</label>
                  <input
                    type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Initialize Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal Popup */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Add Task Schedule</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Task Title</label>
                <input
                  type="text" required value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Masonry Layer Plaster"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Task specifications for engineers"
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Priority</label>
                  <select
                    value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Due Date</label>
                  <input
                    type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
