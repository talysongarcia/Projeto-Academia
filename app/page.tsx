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
  BarChart2,
  Dumbbell,
  LayoutGrid,
  CalendarDays,
  Plus,
  X,
  ImageIcon
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
    exercises: { [exerciseId: string]: boolean };
  };
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

// --- Components ---

export default function VoltApp() {
  const [activeView, setActiveView] = React.useState<'home' | 'calendar' | 'add' | 'stats'>('calendar');
  const [groups, setGroups] = React.useState<Group[]>(INITIAL_GROUPS);
  const [exercises, setExercises] = React.useState<Exercise[]>(INITIAL_EXERCISES);
  const [plan, setPlan] = React.useState<WorkoutPlan>(INITIAL_PLAN);
  const [logs, setLogs] = React.useState<WorkoutLog>({});
  
  // Date State for Calendar View
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  // Form States
  const [newEx, setNewEx] = React.useState({ name: '', sets: 3, reps: '10', groupId: INITIAL_GROUPS[0]?.id || '', image: '' });
  const [newGroup, setNewGroup] = React.useState({ name: '', image: '' });

  // Image Preview State
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const getDayName = (date: Date) => {
    const day = date.getDay(); // 0 is Sunday
    const index = day === 0 ? 6 : day - 1;
    return WEEKDAYS[index];
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const toggleExercise = (exerciseId: string) => {
    const dateKey = formatDateKey(selectedDate);
    const dayData = logs[dateKey] || { exercises: {} };
    
    if (dayData.finished) return;

    setLogs(prev => ({
      ...prev,
      [dateKey]: {
        ...dayData,
        exercises: {
          ...dayData.exercises,
          [exerciseId]: !dayData.exercises[exerciseId]
        }
      }
    }));
  };

  const finishWorkout = () => {
    const dateKey = formatDateKey(selectedDate);
    const dayData = logs[dateKey] || { exercises: {} };
    
    if (confirm('Deseja realmente finalizar o treino? Após finalizar, não será possível alterar os exercícios.')) {
      setLogs(prev => ({
        ...prev,
        [dateKey]: {
          ...dayData,
          finished: true
        }
      }));
    }
  };

  // --- Views ---

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <section>
        <h2 className="font-anybody font-bold text-3xl text-primary">Dashboard</h2>
        <p className="text-outline text-sm">Seu desempenho semanal</p>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {/* Treinos da Semana */}
        <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem]">
          <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest mb-4">Status Semanal</h3>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {SHORT_DAYS.map((day, i) => {
              const dayName = WEEKDAYS[i];
              const hasGroup = plan[dayName];
              const isCompleted = Math.random() > 0.5; // Mocking visual check
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-2">Média Semanal</p>
            <p className="font-anybody font-bold text-2xl text-primary">54m</p>
          </div>
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-2">Média Mensal</p>
            <p className="font-anybody font-bold text-2xl text-secondary-container">51m</p>
          </div>
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem] col-span-2">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-2">Dias Ausentes (Mês)</p>
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
              {remains} Exercícios Restantes
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
                  onClick={() => toggleExercise(exercise.id)}
                  className="workout-card-glow bg-surface-container-high p-4 rounded-xl border border-white/5 flex items-center gap-4 relative overflow-hidden cursor-pointer group hover:border-white/10 transition-all"
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
                onClick={finishWorkout}
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
        className="space-y-12 pb-40"
      >
        <section>
          <h2 className="font-anybody font-bold text-3xl text-primary uppercase">PERSONALIZAÇÃO</h2>
        </section>

        {/* Montar Treino da Semana */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
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
            <div className="space-y-2">
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">URL da Imagem (Opcional)</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={newGroup.image}
                onChange={e => setNewGroup({ ...newGroup, image: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => {
                if (newGroup.name) {
                  setGroups([...groups, { id: Date.now().toString(), name: newGroup.name, image: newGroup.image }]);
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
              <label className="text-[10px] text-outline uppercase font-bold tracking-widest">URL da Imagem (Opcional)</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={newEx.image}
                onChange={e => setNewEx({ ...newEx, image: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-xl p-3 text-sm focus:border-primary-container outline-none transition-all"
              />
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
              onClick={() => {
                if (newEx.name && newEx.groupId) {
                  setExercises([...exercises, { ...newEx, id: Date.now().toString() }]);
                  setNewEx({ name: '', sets: 3, reps: '10', groupId: groups[0]?.id || '', image: '' });
                }
              }}
              className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(195,244,0,0.4)] active:scale-95 transition-all mt-4"
            >
              Cadastrar Exercício
            </button>
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
      className="space-y-8 pb-10"
    >
      <section>
        <h2 className="font-anybody font-bold text-3xl text-primary">Estatísticas</h2>
        <p className="text-outline text-sm">Análise detalhada do seu progresso</p>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem] space-y-4">
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

        <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem] space-y-4">
          <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest">Exercícios Cadastrados</h3>
          <div className="space-y-2">
            {exercises.map(e => (
              <div key={e.id} className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-white/5">
                <div>
                  <p className="text-sm font-bold">{e.name}</p>
                  <p className="text-[10px] text-outline">{groups.find(g => g.id === e.groupId)?.name} • {e.sets}x{e.reps}</p>
                </div>
                {e.image && <ImageIcon className="w-4 h-4 text-primary-container" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container border border-white/5 p-6 rounded-[2rem] space-y-4">
          <h3 className="font-lexend font-semibold text-sm text-outline uppercase tracking-widest">Volume de Carga (kg)</h3>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {[30, 45, 60, 80, 75, 90, 85, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className={cn(
                    "w-full rounded-t-lg",
                    i === 7 ? "bg-primary-container" : "bg-white/10"
                  )}
                />
                <span className="text-[8px] text-outline font-bold">S{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Total de Sets</p>
            <p className="font-anybody font-bold text-3xl text-primary">124</p>
          </div>
          <div className="bg-surface-container border border-white/5 p-5 rounded-[2rem]">
            <p className="font-lexend text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Recordes Pessoais</p>
            <p className="font-anybody font-bold text-3xl text-secondary-container">12</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-container text-on-primary-container">
            <Dumbbell className="w-5 h-5" />
          </div>
          <h1 className="font-anybody font-extrabold text-xl tracking-tighter text-primary uppercase">
            Volt Performance
          </h1>
        </div>
      </header>

      <main className="mt-20 px-5 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'home' && renderHome()}
          {activeView === 'calendar' && renderCalendar()}
          {activeView === 'add' && renderAdd()}
          {activeView === 'stats' && renderStats()}
        </AnimatePresence>
      </main>

      {/* Image Overlay */}
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
          <BarChart2 className="w-7 h-7" />
        </button>
      </nav>
    </div>
  );
}
