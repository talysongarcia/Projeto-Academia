'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Home, 
  PlusCircle, 
  Settings,
  Dumbbell,
  LayoutGrid,
  CalendarDays,
  Plus,
  X,
  ImageIcon,
  Users,
  Upload,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  groupId: string;
  image?: string;
}

interface Group {
  id: string;
  name: string;
  image?: string;
}

interface WorkoutPlan {
  [day: string]: string; // day of week -> groupId
}

interface WorkoutLog {
  [date: string]: {
    finished?: boolean;
    finishedAt?: string;
    exercises: { [exerciseId: string]: boolean };
  };
}

interface Student {
  id: string;
  name: string;
  pin: string;
  avatar: string;
}

// --- Initial Data ---

const INITIAL_GROUPS: Group[] = [
  { id: '1', name: 'Perna' },
  { id: '2', name: 'Peito e Tríceps' },
  { id: '3', name: 'Costas e Bíceps' },
  { id: '4', name: 'Ombros' },
];

const INITIAL_EXERCISES: Exercise[] = [
  { id: '1', name: 'Agachamento Barra', sets: 4, reps: '8-10', groupId: '1' },
  { id: '2', name: 'Leg Press 45', sets: 3, reps: '12', groupId: '1' },
  { id: '3', name: 'Supino Reto', sets: 4, reps: '8', groupId: '2' },
  { id: '4', name: 'Tríceps Polia', sets: 3, reps: '12', groupId: '2' },
  { id: '5', name: 'Puxada Frente', sets: 4, reps: '10', groupId: '3' },
];

const INITIAL_PLAN: WorkoutPlan = {
  'Segunda': '1',
  'Terça': '2',
  'Quarta': '3',
  'Quinta': '4',
  'Sexta': '1',
  'Sábado': '2',
  'Domingo': '',
};

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const SHORT_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const AVATARS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1521651201144-634f700b36ef?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
];

// --- Components ---

function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function VoltApp() {
  const [activeView, setActiveView] = React.useState<'home' | 'calendar' | 'add' | 'stats'>('calendar');
  const [groups, setGroups] = React.useState<Group[]>(INITIAL_GROUPS);
  const [exercises, setExercises] = React.useState<Exercise[]>(INITIAL_EXERCISES);
  const [plan, setPlan] = React.useState<WorkoutPlan>(INITIAL_PLAN);
  const [logs, setLogs] = React.useState<WorkoutLog>({});
  
  const [isNeonEnabled, setIsNeonEnabled] = React.useState(false);
  const [isNeonConnecting, setIsNeonConnecting] = React.useState(true);
  const [neonConnectionError, setNeonConnectionError] = React.useState<string | null>(null);
  
  // Date State for Calendar View
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSelectedDate(new Date());
      setMounted(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // Form States
  const [newEx, setNewEx] = React.useState({ name: '', sets: 3, reps: '10', groupId: INITIAL_GROUPS[0]?.id || '', image: '' });
  const [newGroup, setNewGroup] = React.useState({ name: '', image: '' });
  const [newStudent, setNewStudent] = React.useState({ name: '', pin: '', avatar: AVATARS[0] });

  const [students, setStudents] = React.useState<Student[]>([]);

  // Image Preview State
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>('');
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
  const [exSuccessMsg, setExSuccessMsg] = React.useState<string | null>(null);

  const [authenticatedStudent, setAuthenticatedStudent] = React.useState<Student | null>(null);
  const [loginStage, setLoginStage] = React.useState<'SELECT' | 'PIN'>('SELECT');
  const [selectedForLogin, setSelectedForLogin] = React.useState<Student | null>(null);
  const [pinInput, setPinInput] = React.useState('');
  const [loginError, setLoginError] = React.useState(false);

  const [isDataLoaded, setIsDataLoaded] = React.useState(false);

  // 1. Load students list and check Neon configuration on mount
  React.useEffect(() => {
    if (!mounted) return;
    
    const initializeApp = async () => {
      try {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check-connection' })
        });
        const data = await response.json();
        if (data.success && data.configured) {
          setIsNeonEnabled(true);
          setNeonConnectionError(null);
          const stRes = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list-students' })
          });
          const stData = await stRes.json();
          if (stData.success && Array.isArray(stData.students)) {
            setStudents(stData.students);
            setIsNeonConnecting(false);
            return;
          }
        } else if (data.configured && data.error) {
          setNeonConnectionError(data.error);
        }
      } catch (e: any) {
        console.error('Error initializing Neon connection:', e);
        setNeonConnectionError(e.message || 'Erro de rede ao conectar com o banco.');
      }
      
      // Fallback
      setIsNeonEnabled(false);
      setIsNeonConnecting(false);
      const cachedStudents = localStorage.getItem('treinofofo_students');
      if (cachedStudents) {
        try {
          const parsed = JSON.parse(cachedStudents);
          if (Array.isArray(parsed)) {
            setStudents(parsed);
          }
        } catch (e) {
          console.error('Error loading students from localStorage', e);
        }
      }
    };

    initializeApp();
  }, [mounted]);

  // Save general students list to localStorage (only when not synced with Neon)
  React.useEffect(() => {
    if (!mounted || isNeonEnabled) return;
    localStorage.setItem('treinofofo_students', JSON.stringify(students));
  }, [students, mounted, isNeonEnabled]);

  // 2. Load or reset student-specific data from localStorage or Neon Database
  React.useEffect(() => {
    if (!mounted) return;
    
    const loadStudentData = async () => {
      if (authenticatedStudent) {
        setIsDataLoaded(false);
        const sId = authenticatedStudent.id;

        if (isNeonEnabled) {
          try {
            const res = await fetch('/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'get-student-data', studentId: sId })
            });
            const data = await res.json();
            if (data.success) {
              setGroups(data.groups || []);
              setExercises(data.exercises || []);
              setPlan(data.plan || {
                'Segunda': '', 'Terça': '', 'Quarta': '', 'Quinta': '', 'Sexta': '', 'Sábado': '', 'Domingo': ''
              });
              setLogs(data.logs || {});
              setIsDataLoaded(true);
              return;
            }
          } catch (e) {
            console.error('Failed to load data from Neon, using local storage fallback...', e);
          }
        }

        // Local storage cache fallback
        let loadedGroups = INITIAL_GROUPS;
        try {
          const cached = localStorage.getItem(`treinofofo_groups_${sId}`);
          if (cached) loadedGroups = JSON.parse(cached);
        } catch (e) { console.error(e); }
        setGroups(loadedGroups);

        let loadedExercises = INITIAL_EXERCISES;
        try {
          const cached = localStorage.getItem(`treinofofo_exercises_${sId}`);
          if (cached) loadedExercises = JSON.parse(cached);
        } catch (e) { console.error(e); }
        setExercises(loadedExercises);

        let loadedPlan = INITIAL_PLAN;
        try {
          const cached = localStorage.getItem(`treinofofo_plan_${sId}`);
          if (cached) loadedPlan = JSON.parse(cached);
        } catch (e) { console.error(e); }
        setPlan(loadedPlan);

        let loadedLogs = {};
        try {
          const cached = localStorage.getItem(`treinofofo_logs_${sId}`);
          if (cached) loadedLogs = JSON.parse(cached);
        } catch (e) { console.error(e); }
        setLogs(loadedLogs);

        setIsDataLoaded(true);
      } else {
        setIsDataLoaded(false);
        setGroups(INITIAL_GROUPS);
        setExercises(INITIAL_EXERCISES);
        setPlan(INITIAL_PLAN);
        setLogs({});
      }
    };

    loadStudentData();
  }, [authenticatedStudent, mounted, isNeonEnabled]);

  // 3. Save student-specific states to localStorage dynamically only when fully loaded (only if Neon is not handling it)
  React.useEffect(() => {
    if (!mounted || !authenticatedStudent || !isDataLoaded || isNeonEnabled) return;
    localStorage.setItem(`treinofofo_groups_${authenticatedStudent.id}`, JSON.stringify(groups));
  }, [groups, authenticatedStudent, mounted, isDataLoaded, isNeonEnabled]);

  React.useEffect(() => {
    if (!mounted || !authenticatedStudent || !isDataLoaded || isNeonEnabled) return;
    localStorage.setItem(`treinofofo_exercises_${authenticatedStudent.id}`, JSON.stringify(exercises));
  }, [exercises, authenticatedStudent, mounted, isDataLoaded, isNeonEnabled]);

  React.useEffect(() => {
    if (!mounted || !authenticatedStudent || !isDataLoaded || isNeonEnabled) return;
    localStorage.setItem(`treinofofo_plan_${authenticatedStudent.id}`, JSON.stringify(plan));
  }, [plan, authenticatedStudent, mounted, isDataLoaded, isNeonEnabled]);

  React.useEffect(() => {
    if (!mounted || !authenticatedStudent || !isDataLoaded || isNeonEnabled) return;
    localStorage.setItem(`treinofofo_logs_${authenticatedStudent.id}`, JSON.stringify(logs));
  }, [logs, authenticatedStudent, mounted, isDataLoaded, isNeonEnabled]);

  // Keep first option of newEx synced with current active groups to avoid selector mismatch
  React.useEffect(() => {
    if (groups && groups.length > 0) {
      setTimeout(() => {
        setNewEx(prev => ({ ...prev, groupId: groups[0].id }));
      }, 0);
    }
  }, [groups]);

  if (!mounted || !selectedDate) return <div className="min-h-screen bg-background" />;

  const getDayName = (date: Date) => {
    const day = date.getDay(); // 0 is Sunday
    const index = day === 0 ? 6 : day - 1;
    return WEEKDAYS[index];
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toggleExercise = (exerciseId: string) => {
    const dateKey = formatDateKey(selectedDate);
    
    setLogs(prev => {
      const dayData = prev[dateKey] || { exercises: {} };
      if (dayData.finished) return prev;

      const newLogs = {
        ...prev,
        [dateKey]: {
          ...dayData,
          exercises: {
            ...dayData.exercises,
            [exerciseId]: !dayData.exercises[exerciseId]
          }
        }
      };

      if (isNeonEnabled && authenticatedStudent) {
        const targetLog = newLogs[dateKey];
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-log',
            studentId: authenticatedStudent.id,
            date: dateKey,
            finished: targetLog.finished || false,
            finishedAt: targetLog.finishedAt || null,
            exercises: targetLog.exercises
          })
        }).catch(err => console.error('Failed to sync toggle to Neon:', err));
      }

      return newLogs;
    });
  };

  const finishWorkout = () => {
    const dateKey = formatDateKey(selectedDate);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('pt-BR');
    const finishedAtStr = `${dateStr} às ${timeStr}`;
    
    setLogs(prev => {
      const dayData = prev[dateKey] || { exercises: {} };
      const newLogs = {
        ...prev,
        [dateKey]: {
          ...dayData,
          finished: true,
          finishedAt: finishedAtStr
        }
      };

      if (isNeonEnabled && authenticatedStudent) {
        const targetLog = newLogs[dateKey];
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-log',
            studentId: authenticatedStudent.id,
            date: dateKey,
            finished: true,
            finishedAt: finishedAtStr,
            exercises: targetLog.exercises
          })
        }).catch(err => console.error('Failed to sync finish to Neon:', err));
      }

      return newLogs;
    });
    setShowConfirm(false);
  };

  const savePlan = async () => {
    if (isNeonEnabled && authenticatedStudent) {
      setSaveStatus("Salvando no Neon...");
      try {
        for (const [day, groupId] of Object.entries(plan)) {
          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'save-plan', 
              studentId: authenticatedStudent.id, 
              dayOfWeek: day, 
              groupId: groupId || null
            })
          });
        }
        setSaveStatus("Treino alterado no Neon!");
      } catch (err) {
        console.error('Error saving plan to Neon:', err);
        setSaveStatus("Erro ao salvar no banco");
      }
    } else {
      setSaveStatus("Treino alterado com sucesso localmente");
    }
    
    if (authenticatedStudent) {
      localStorage.setItem(`treinofofo_plan_${authenticatedStudent.id}`, JSON.stringify(plan));
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Views ---

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <section>
        <h2 className="font-anybody font-bold text-3xl text-primary leading-tight uppercase">Inicio</h2>
        <p className="text-outline text-xs">Seu desempenho semanal</p>
      </section>

      <div className="grid grid-cols-1 gap-2.5">
        {/* Treinos da Semana */}
        <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
          <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest mb-3">Status Semanal</h3>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {SHORT_DAYS.map((day, i) => {
              const dayName = WEEKDAYS[i];
              const hasGroup = plan[dayName];
              
              // Calculate the date for this weekday in the current week
              const now = new Date();
              const currentDay = now.getDay(); // 0-6
              const diff = (i + 1) - (currentDay === 0 ? 7 : currentDay);
              const d = new Date(now);
              d.setDate(now.getDate() + diff);
              const dateKey = formatDateKey(d);
              
              const isCompleted = logs[dateKey]?.finished;
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all",
                    hasGroup ? (isCompleted ? "bg-primary-container border-primary-container" : "bg-white/5 border-white/10") : "bg-transparent border-dashed border-white/5 opacity-30"
                  )}>
                    {hasGroup && isCompleted ? <Check className="w-4 h-4 sm:w-5 h-5 text-on-primary-container" /> : null}
                    {hasGroup && !isCompleted ? <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> : null}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-outline font-bold uppercase">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Média de Tempo etc */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Média Semanal</p>
            <p className="font-anybody font-bold text-2xl text-primary">54m</p>
          </div>
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Média Mensal</p>
            <p className="font-anybody font-bold text-2xl text-secondary-container">51m</p>
          </div>
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem] col-span-2">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Dias Ausentes (Mês)</p>
            <div className="flex items-end gap-2">
              <p className="font-anybody font-bold text-4xl text-primary">04</p>
              <span className="text-outline text-xs mb-1">dias</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCalendar = () => {
    const todayName = getDayName(selectedDate);
    const groupId = plan[todayName];
    const group = groups.find(g => g.id === groupId);
    const dayExercises = exercises.filter(e => e.groupId === groupId);
    const dateKey = formatDateKey(selectedDate);
    const dayData = logs[dateKey] || { exercises: {} };
    const dayLogs = dayData.exercises;
    const isFinished = dayData.finished;
    const completedCount = dayExercises.filter(e => dayLogs[e.id]).length;
    const remains = dayExercises.length - completedCount;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6 pb-10"
      >
        {/* Horizontal Calendar */}
        <section className="flex overflow-x-auto gap-2 pb-2 no-scrollbar calendar-mask -mx-5 px-5">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(selectedDate);
            d.setDate(selectedDate.getDate() - 3 + i);
            const isActive = d.toDateString() === selectedDate.toDateString();
            const dayNum = d.getDate();
            const dayLabel = SHORT_DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "flex-shrink-0 w-12 h-16 flex flex-col items-center justify-center rounded-lg border transition-all duration-300",
                  isActive 
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(195,244,0,0.3)] border-primary-container/20" 
                    : "bg-surface-container border-white/5 opacity-60"
                )}
              >
                <span className={cn(
                  "text-[8px] uppercase tracking-wider mb-0.5",
                  isActive ? "font-bold" : "text-outline"
                )}>
                  {dayLabel}
                </span>
                <span className={cn(
                  "font-anybody text-lg leading-none",
                  isActive ? "font-extrabold" : "font-semibold"
                )}>
                  {dayNum}
                </span>
              </button>
            );
          })}
        </section>

        <section className="flex items-center justify-between">
          <h3 className="font-lexend font-semibold text-xs text-outline uppercase tracking-[0.15em]">
            {group ? `Treino de ${group.name}` : 'Descanso'}
          </h3>
          {group && (
            <span className="font-lexend text-[10px] font-bold text-primary-container bg-primary-container/10 px-3 py-1 rounded-full uppercase">
              {remains} Restantes
            </span>
          )}
        </section>

        <section className="space-y-2">
          {dayExercises.length > 0 ? (
            <>
              {dayExercises.map((exercise) => (
                <motion.div
                  layout
                  key={exercise.id}
                  onClick={() => !isFinished && toggleExercise(exercise.id)}
                  className={cn(
                    "workout-card-glow bg-surface-container-high p-4 rounded-xl border border-white/5 flex items-center gap-4 relative overflow-hidden transition-all",
                    isFinished ? "cursor-default opacity-80" : "cursor-pointer group hover:border-white/10"
                  )}
                >
                  {dayLogs[exercise.id] && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-container" />
                  )}
                  
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300",
                      dayLogs[exercise.id] ? "bg-primary-container completed-glow" : "border-2 border-outline/30",
                      isFinished && !dayLogs[exercise.id] && "opacity-20"
                    )}>
                      {dayLogs[exercise.id] && <Check className="w-4 h-4 text-on-primary-container stroke-[3px]" />}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className={cn(
                      "font-lexend font-bold text-base leading-tight transition-all",
                      dayLogs[exercise.id] ? "text-primary/40 line-through" : "text-primary"
                    )}>
                      {exercise.name}
                    </h4>
                    <p className="font-lexend text-[10px] text-outline mt-0.5">
                      {exercise.sets} Séries × {exercise.reps}
                    </p>
                  </div>

                  {exercise.image && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(exercise.image!);
                      }}
                      className="p-2 text-outline hover:text-primary-container transition-colors"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}

              <button 
                onClick={() => setShowConfirm(true)}
                disabled={completedCount < dayExercises.length || isFinished}
                className={cn(
                  "w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all",
                  (completedCount < dayExercises.length || isFinished)
                    ? "bg-white/5 text-outline cursor-not-allowed"
                    : "bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(195,244,0,0.4)] active:scale-95"
                )}
              >
                {isFinished ? 'Treino Finalizado' : 'Finalizar Treino'}
              </button>
              {isFinished && dayData.finishedAt && (
                <p className="text-center text-[10px] text-primary-container font-bold uppercase tracking-wider animate-pulse">
                  Concluído em: {dayData.finishedAt}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-10 opacity-30">
              <Dumbbell className="mx-auto w-12 h-12 mb-4" />
              <p>Nenhum treino planejado para hoje.</p>
            </div>
          )}
        </section>
      </motion.div>
    );
  };

  const renderAdd = () => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-40"
      >
        <section className="mb-2">
          <h2 className="font-anybody font-bold text-3xl text-primary uppercase">PERSONALIZAÇÃO</h2>
        </section>

        {/* Montar Treino da Semana */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-primary-container" />
            <h3 className="font-lexend font-bold text-lg">Cronograma Semanal</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="flex items-center justify-between bg-surface-container p-3 rounded-xl border border-white/5">
                <span className="font-lexend text-sm font-semibold">{day}</span>
                <select 
                  value={plan[day]} 
                  onChange={(e) => setPlan(prev => ({ ...prev, [day]: e.target.value }))}
                  className="bg-background border border-white/10 rounded-lg text-xs p-1 px-2 focus:ring-1 focus:ring-primary-container outline-none"
                >
                  <option value="">Descanso</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="space-y-3 mt-2">
            <button 
              onClick={savePlan}
              className="w-full bg-white/5 border border-white/10 text-primary-container font-lexend font-bold py-3 rounded-xl hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              SALVAR TREINO
            </button>
            <AnimatePresence>
              {saveStatus && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center text-xs font-bold text-primary-container"
                >
                  {saveStatus}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Cadastrar Grupos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-5 h-5 text-primary-container" />
            <h3 className="font-lexend font-bold text-lg">Grupos Musculares</h3>
          </div>
          <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Nome do Grupo</label>
              <input 
                type="text" 
                placeholder="Ex: Quadríceps..." 
                value={newGroup.name}
                onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
              />
            </div>
            <button 
              onClick={async () => {
                if (newGroup.name && authenticatedStudent) {
                  const newId = generateUUID();
                  const groupPayload = { id: newId, name: newGroup.name };
                  
                  if (isNeonEnabled) {
                    try {
                      await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'save-group',
                          id: newId,
                          studentId: authenticatedStudent.id,
                          name: newGroup.name,
                          image: null
                        })
                      });
                    } catch (err) {
                      console.error('Error saving group to Neon:', err);
                    }
                  }
                  
                  setGroups([...groups, groupPayload]);
                  setNewGroup({ name: '', image: '' });
                }
              }}
              className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-xl shadow-[0_0_10px_rgba(195,244,0,0.3)] active:scale-95 transition-all"
            >
              Criar Grupo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map(g => (
              <div key={g.id} className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                {g.name}
              </div>
            ))}
          </div>
        </section>

        {/* Cadastrar Exercícios */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-5 h-5 text-primary-container" />
            <h3 className="font-lexend font-bold text-lg">Novo Exercício</h3>
          </div>
          <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Nome do Exercício</label>
              <input 
                type="text" 
                value={newEx.name}
                onChange={e => setNewEx({ ...newEx, name: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Séries</label>
                <input 
                  type="number" 
                  value={newEx.sets}
                  onChange={e => setNewEx({ ...newEx, sets: parseInt(e.target.value) })}
                  className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Repetições</label>
                <input 
                  type="text" 
                  value={newEx.reps}
                  onChange={e => setNewEx({ ...newEx, reps: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Foto do Exercício (Opcional)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 bg-background border border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-primary-container hover:bg-primary-container/5 transition-all group">
                  <Upload className="w-5 h-5 text-outline group-hover:text-primary-container" />
                  <span className="text-sm font-semibold text-outline group-hover:text-primary-container uppercase tracking-tight">Upload da imagem</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, (url) => setNewEx({ ...newEx, image: url }))}
                  />
                </label>
                {newEx.image && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-primary-container/50">
                    <Image src={newEx.image} alt="Preview" fill className="object-cover" />
                    <button 
                      onClick={() => setNewEx({ ...newEx, image: '' })}
                      className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Grupo Muscular</label>
              <select 
                value={newEx.groupId}
                onChange={e => setNewEx({ ...newEx, groupId: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all appearance-none"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={async () => {
                if (newEx.name && newEx.groupId && authenticatedStudent) {
                  const newId = generateUUID();
                  const exercisePayload = { ...newEx, id: newId };
                  
                  if (isNeonEnabled) {
                    try {
                      await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'save-exercise',
                          id: newId,
                          studentId: authenticatedStudent.id,
                          groupId: newEx.groupId,
                          name: newEx.name,
                          sets: newEx.sets,
                          reps: newEx.reps,
                          image: newEx.image || null
                        })
                      });
                    } catch (err) {
                      console.error('Error saving exercise to Neon:', err);
                    }
                  }
                  
                  setExercises([...exercises, exercisePayload]);
                  setNewEx({ name: '', sets: 3, reps: '10', groupId: groups[0]?.id || '', image: '' });
                  setExSuccessMsg(`Exercício "${exercisePayload.name}" cadastrado com sucesso!`);
                  setTimeout(() => {
                    setExSuccessMsg(null);
                  }, 4000);
                }
              }}
              className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(195,244,0,0.4)] active:scale-95 transition-all mt-4"
            >
              Cadastrar Exercício
            </button>
            <AnimatePresence>
              {exSuccessMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-center text-xs font-bold font-lexend flex items-center justify-center gap-2 mt-2"
                >
                  <Check className="w-4 h-4 shrink-0 text-green-400" />
                  <span>{exSuccessMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>
    );
  };

  const renderStats = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5 pb-10"
    >
      <section>
        <h2 className="font-anybody font-bold text-3xl text-primary">CONFIGURAÇÕES</h2>
      </section>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem] space-y-3">
          <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest">Grupos Cadastrados</h3>
          <div className="flex flex-wrap gap-2">
            {groups.map(g => (
              <div key={g.id} className="bg-white/5 px-3 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                {g.image && <div className="w-4 h-4 rounded-full bg-primary-container" />}
                <span className="text-xs font-semibold">{g.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem] space-y-3">
          <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest">Exercícios Cadastrados</h3>
          <div className="space-y-2">
            {exercises.map(e => (
              <div key={e.id} className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-white/5">
                <div>
                  <p className="text-sm font-bold">{e.name}</p>
                  <p className="text-[10px] text-outline">{groups.find(g => g.id === e.groupId)?.name} • {e.sets}x{e.reps}</p>
                </div>
                {e.image && (
                  <button 
                    onClick={() => setSelectedImage(e.image!)}
                    className="p-2 text-primary-container hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Total de Sets</p>
            <p className="font-anybody font-bold text-3xl text-primary">124</p>
          </div>
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Recordes Pessoais</p>
            <p className="font-anybody font-bold text-3xl text-secondary-container">12</p>
          </div>
        </div>

        {/* Cadastro de Alunos */}
        <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem] space-y-6">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary-container" />
            <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest">Cadastrar Novo Aluno</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">Nome do Aluno</label>
              <input 
                type="text" 
                placeholder="Ex: João Silva..." 
                value={newStudent.name}
                onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">PIN de Acesso (4 dígitos)</label>
              <input 
                type="password" 
                maxLength={4}
                placeholder="****" 
                value={newStudent.pin}
                onChange={e => setNewStudent({ ...newStudent, pin: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none tracking-[0.5em] text-center"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest block">Escolha um Avatar</label>
              <div className="grid grid-cols-5 gap-3 bg-background/50 p-4 rounded-2xl border border-white/5">
                {AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewStudent({ ...newStudent, avatar })}
                    className={cn(
                      "relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all mx-auto",
                      newStudent.avatar === avatar ? "border-primary-container scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-80"
                    )}
                  >
                    <Image src={avatar} alt={`Avatar ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={async () => {
                if (newStudent.name && newStudent.pin.length === 4) {
                  const newId = generateUUID();
                  const studentPayload = { ...newStudent, id: newId };
                  
                  if (isNeonEnabled) {
                    try {
                      const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'create-student', ...studentPayload })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setStudents([...students, data.student]);
                      }
                    } catch (err) {
                      console.error('Error creating student on Neon:', err);
                    }
                  } else {
                    setStudents([...students, studentPayload]);
                  }
                  
                  setNewStudent({ name: '', pin: '', avatar: AVATARS[0] });
                }
              }}
              className="w-full bg-primary-container text-on-primary-container font-extrabold py-4 rounded-xl shadow-[0_0_20px_rgba(195,244,0,0.3)] active:scale-95 transition-all mt-4"
            >
              CADASTRAR ALUNO
            </button>
          </div>

          {students.length > 0 && (
            <div className="pt-6 border-t border-white/5 space-y-4">
              <h4 className="text-[10px] text-outline uppercase font-bold tracking-widest">Alunos Ativos</h4>
              <div className="space-y-2">
                {students.map(student => (
                  <div key={student.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                      <Image src={student.avatar} alt={student.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{student.name}</p>
                      <p className="text-[10px] text-outline uppercase font-semibold">PIN: ****</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderLogin = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-primary-container rounded-3xl overflow-hidden flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(195,244,0,0.2)]">
          <Image 
            src="/api/favicon" 
            alt="Logo Treino Fofo" 
            width={80} 
            height={80} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-anybody font-black text-4xl text-primary tracking-tighter uppercase leading-none">
          TREINO FOFO
        </h1>
        <p className="text-outline text-xs uppercase tracking-[0.2em] font-bold">Quem está acessando?</p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {neonConnectionError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-start space-y-2 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider">Atenção: Configuração com Neon</h4>
            </div>
            <p className="text-xs text-red-200/95 leading-relaxed font-semibold">
              {neonConnectionError}
            </p>
            <div className="text-[10px] text-red-300/80 leading-normal font-mono bg-black/30 p-2 rounded-lg">
              Dica: Copie a <strong className="text-primary">Connection String</strong> PostgreSQL no Neon (começando com <code className="text-white">postgresql://</code> ou <code className="text-white">postgres://</code>) em vez de links HTTP ou REST.
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {loginStage === 'SELECT' ? (
            <motion.div 
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 gap-4"
            >
              {students.length > 0 ? (
                students.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedForLogin(student);
                      setLoginStage('PIN');
                    }}
                    className="bg-surface-container border border-white/5 p-5 rounded-[2rem] flex flex-col items-center gap-3 hover:border-primary-container/30 transition-all active:scale-95 group"
                  >
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary-container transition-all">
                      <Image src={student.avatar} alt={student.name} fill className="object-cover" />
                    </div>
                    <span className="text-sm font-bold uppercase w-full text-center line-clamp-2 px-2">{student.name}</span>
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 space-y-4">
                  <p className="text-outline text-sm italic">Nenhum aluno cadastrado no sistema.</p>
                  <button 
                    onClick={() => {
                      // Temporary for evaluation - seed one if empty
                      const dummy = { id: 'dummy', name: 'Aluno Exemplo', pin: '1234', avatar: AVATARS[0] };
                      setStudents([dummy]);
                    }}
                    className="text-primary-container text-xs font-bold uppercase tracking-widest underline"
                  >
                    Criar aluno de teste
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="pin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container border border-white/5 p-8 rounded-[2.5rem] space-y-8 text-center"
            >
              <div className="space-y-3">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container mx-auto shadow-2xl">
                  <Image src={selectedForLogin?.avatar || ''} alt="User" fill className="object-cover" />
                </div>
                <h3 className="font-lexend font-bold text-xl uppercase tracking-tighter">{selectedForLogin?.name}</h3>
                <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Insira seu PIN de 4 dígitos</p>
              </div>

              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300",
                      pinInput.length > i 
                        ? "bg-primary-container scale-125 shadow-[0_0_10px_rgba(195,244,0,0.5)]" 
                        : "bg-white/10"
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 0, '✓'].map(num => (
                  <button
                    key={num.toString()}
                    onClick={() => {
                      if (num === 'X') setPinInput(prev => prev.slice(0, -1));
                      else if (num === '✓') {
                        if (pinInput === selectedForLogin?.pin) {
                          setAuthenticatedStudent(selectedForLogin);
                        } else {
                          setLoginError(true);
                          setPinInput('');
                          setTimeout(() => setLoginError(false), 2000);
                        }
                      } else if (pinInput.length < 4 && typeof num === 'number') {
                        setPinInput(prev => prev + num);
                      }
                    }}
                    className={cn(
                      "h-14 rounded-2xl flex items-center justify-center font-anybody text-xl font-bold transition-all active:scale-90",
                      num === '✓' ? "bg-primary-container text-on-primary-container" : "bg-white/5 border border-white/5 hover:bg-white/10"
                    )}
                  >
                    {num === 'X' ? <X className="w-5 h-5" /> : num}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  setLoginStage('SELECT');
                  setPinInput('');
                }}
                className="text-[10px] text-outline uppercase font-bold tracking-widest hover:text-primary transition-colors"
              >
                Voltar para seleção
              </button>

              {loginError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs font-bold uppercase tracking-tight absolute inset-x-0 -bottom-10"
                >
                  PIN INCORRETO
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      <AnimatePresence>
        {!authenticatedStudent && renderLogin()}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-5 h-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container overflow-hidden text-on-primary-container">
            <Image 
              src="/api/favicon" 
              alt="Logo" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="font-anybody font-black text-2xl tracking-tighter text-primary uppercase leading-tight">
                TREINO FOFO
              </h1>
              {isNeonConnecting ? (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse cursor-help" title="Verificando conexão com o banco de dados..." />
              ) : isNeonEnabled ? (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse cursor-help" title="Conectado ao Banco Neon Sincronizado!" />
              ) : neonConnectionError ? (
                <span 
                  className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)] animate-pulse cursor-help" 
                  title={`Erro no Neon: ${neonConnectionError}`}
                />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 hover:bg-neutral-500 transition-colors cursor-help" title="Usando Armazenamento Local (Offline)" />
              )}
            </div>
            {authenticatedStudent && (
              <p className="text-[10px] font-lexend font-bold text-outline uppercase tracking-widest -mt-1">
                Aluno: {authenticatedStudent.name}
              </p>
            )}
          </div>
        </div>

        {authenticatedStudent && (
          <button 
            onClick={() => {
              setAuthenticatedStudent(null);
              setLoginStage('SELECT');
              setPinInput('');
            }}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-active:scale-95 transition-all">
              <LogOut className="w-5 h-5 text-outline group-hover:text-red-400" />
            </div>
            <span className="text-[8px] font-bold text-outline group-hover:text-red-400 uppercase tracking-widest">Sair</span>
          </button>
        )}
      </header>

      <main className="mt-20 px-5 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'home' && renderHome()}
          {activeView === 'calendar' && renderCalendar()}
          {activeView === 'add' && renderAdd()}
          {activeView === 'stats' && renderStats()}
        </AnimatePresence>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-container border border-white/10 p-8 rounded-[2rem] w-full max-w-sm text-center space-y-6"
            >
              <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto">
                <Dumbbell className="w-8 h-8 text-primary-container" />
              </div>
              <h3 className="font-lexend font-bold text-xl">Deseja finalizar o treino?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="py-3 px-6 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors"
                >
                  NÃO
                </button>
                <button 
                  onClick={finishWorkout}
                  className="py-3 px-6 rounded-xl bg-primary-container text-on-primary-container font-extrabold shadow-[0_0_15px_rgba(195,244,0,0.3)] active:scale-95 transition-all"
                >
                  SIM
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-5"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <Image 
                src={selectedImage} 
                alt="Exercise" 
                fill 
                className="object-cover" 
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 bg-[#131313]/90 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] shadow-[0_-4px_20px_rgba(195,244,0,0.1)] flex justify-around items-center h-20 pb-safe px-4">
        <button 
          onClick={() => setActiveView('home')}
          className={cn(
            "p-4 transition-all active:scale-90",
            activeView === 'home' ? "text-primary-container" : "text-outline hover:text-primary"
          )}
        >
          <Home className="w-7 h-7" />
        </button>
        <button 
          onClick={() => setActiveView('calendar')}
          className={cn(
            "rounded-full p-4 transition-all duration-300",
            activeView === 'calendar' 
              ? "bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(195,244,0,0.4)]" 
              : "text-outline bg-transparent hover:text-primary"
          )}
        >
          <Dumbbell className="w-7 h-7" />
        </button>
        <button 
          onClick={() => setActiveView('add')}
          className={cn(
            "p-4 transition-all active:scale-90",
            activeView === 'add' ? "text-primary-container" : "text-outline hover:text-primary"
          )}
        >
          <PlusCircle className="w-9 h-9" />
        </button>
        <button 
          onClick={() => setActiveView('stats')}
          className={cn(
            "p-4 transition-all active:scale-90",
            activeView === 'stats' ? "text-primary-container" : "text-outline hover:text-primary"
          )}
        >
          <Settings className="w-7 h-7" />
        </button>
      </nav>
    </div>
  );
}
