import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ 
        success: false, 
        configured: false, 
        error: 'DATABASE_URL environment variable is not defined.' 
      });
    }

    const { action, ...args } = await req.json();
    const sql = neon(databaseUrl);

    if (action === 'check-connection') {
      try {
        await sql`SELECT 1`;
        return NextResponse.json({ success: true, configured: true, message: 'Conectado ao Neon com sucesso!' });
      } catch (err: any) {
        return NextResponse.json({ 
          success: false, 
          configured: true, 
          error: `Falha na conexão: ${err.message || err}` 
        });
      }
    }

    if (action === 'list-students') {
      const students = await sql`
        SELECT id::text, name, pin, avatar 
        FROM public.students 
        ORDER BY name ASC
      `;
      return NextResponse.json({ success: true, students });
    }

    if (action === 'create-student') {
      const { id, name, pin, avatar } = args;
      // If client sent an ID (e.g. standard local user being synced), we can preserve or generate
      let st;
      if (id) {
        st = await sql`
          INSERT INTO public.students (id, name, pin, avatar) 
          VALUES (${id}, ${name}, ${pin}, ${avatar})
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pin = EXCLUDED.pin, avatar = EXCLUDED.avatar
          RETURNING id::text, name, pin, avatar
        `;
      } else {
        st = await sql`
          INSERT INTO public.students (name, pin, avatar) 
          VALUES (${name}, ${pin}, ${avatar}) 
          RETURNING id::text, name, pin, avatar
        `;
      }
      return NextResponse.json({ success: true, student: st[0] });
    }

    if (action === 'get-student-data') {
      const { studentId } = args;
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'studentId is required' });
      }

      // 1. Groups
      const groups = await sql`
        SELECT id::text, name, image 
        FROM public.groups 
        WHERE student_id = ${studentId} 
        ORDER BY name ASC
      `;

      // 2. Exercises
      const exercises = await sql`
        SELECT id::text, name, sets, reps, group_id::text as "groupId", image 
        FROM public.exercises 
        WHERE student_id = ${studentId} 
        ORDER BY name ASC
      `;

      // 3. Plans
      const plansRaw = await sql`
        SELECT day_of_week as "dayOfWeek", group_id::text as "groupId" 
        FROM public.workout_plans 
        WHERE student_id = ${studentId}
      `;

      // 4. Logs
      const logsRaw = await sql`
        SELECT id::text, date::text, finished, finished_at as "finishedAt" 
        FROM public.workout_logs 
        WHERE student_id = ${studentId}
      `;

      // 5. Log Exercises
      const logExercisesRaw = await sql`
        SELECT le.log_id::text as "logId", le.exercise_id::text as "exerciseId", le.done 
        FROM public.workout_log_exercises le 
        JOIN public.workout_logs l ON l.id = le.log_id 
        WHERE l.student_id = ${studentId}
      `;

      // Structure outputs
      const plan: Record<string, string> = {
        'Segunda': '', 'Terça': '', 'Quarta': '', 'Quinta': '', 'Sexta': '', 'Sábado': '', 'Domingo': ''
      };
      plansRaw.forEach((row: any) => {
        plan[row.dayOfWeek] = row.groupId || '';
      });

      const logs: Record<string, any> = {};
      logsRaw.forEach((logRow: any) => {
        logs[logRow.date] = {
          finished: logRow.finished,
          finishedAt: logRow.finishedAt || undefined,
          exercises: {}
        };
      });

      logExercisesRaw.forEach((leRow: any) => {
        // Find corresponding log date
        const match = logsRaw.find((l: any) => l.id === leRow.logId);
        if (match && logs[match.date]) {
          logs[match.date].exercises[leRow.exerciseId] = leRow.done;
        }
      });

      return NextResponse.json({
        success: true,
        groups,
        exercises,
        plan,
        logs
      });
    }

    if (action === 'save-group') {
      const { id, studentId, name, image } = args;
      const res = await sql`
        INSERT INTO public.groups (id, student_id, name, image) 
        VALUES (${id}, ${studentId}, ${name}, ${image || null})
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, image = EXCLUDED.image
        RETURNING id::text
      `;
      return NextResponse.json({ success: true, id: res[0].id });
    }

    if (action === 'delete-group') {
      const { id, studentId } = args;
      await sql`
        DELETE FROM public.groups 
        WHERE id = ${id} AND student_id = ${studentId}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'save-exercise') {
      const { id, studentId, groupId, name, sets, reps, image } = args;
      const res = await sql`
        INSERT INTO public.exercises (id, student_id, group_id, name, sets, reps, image) 
        VALUES (${id}, ${studentId}, ${groupId}, ${name}, ${sets}, ${reps}, ${image || null})
        ON CONFLICT (id) DO UPDATE 
        SET group_id = EXCLUDED.group_id, name = EXCLUDED.name, sets = EXCLUDED.sets, reps = EXCLUDED.reps, image = EXCLUDED.image
        RETURNING id::text
      `;
      return NextResponse.json({ success: true, id: res[0].id });
    }

    if (action === 'delete-exercise') {
      const { id, studentId } = args;
      await sql`
        DELETE FROM public.exercises 
        WHERE id = ${id} AND student_id = ${studentId}
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'save-plan') {
      const { studentId, dayOfWeek, groupId } = args;
      await sql`
        INSERT INTO public.workout_plans (student_id, day_of_week, group_id) 
        VALUES (${studentId}, ${dayOfWeek}, ${groupId ? groupId : null})
        ON CONFLICT (student_id, day_of_week) DO UPDATE 
        SET group_id = EXCLUDED.group_id
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'save-log') {
      const { studentId, date, finished, finishedAt, exercises } = args;
      // 1. Upsert head log
      const logRes = await sql`
        INSERT INTO public.workout_logs (student_id, date, finished, finished_at) 
        VALUES (${studentId}, ${date}, ${finished || false}, ${finishedAt ? finishedAt : null})
        ON CONFLICT (student_id, date) DO UPDATE 
        SET finished = EXCLUDED.finished, finished_at = EXCLUDED.finished_at
        RETURNING id::text
      `;
      const logId = logRes[0].id;

      // 2. Refresh exercises state
      await sql`
        DELETE FROM public.workout_log_exercises 
        WHERE log_id = ${logId}
      `;

      if (exercises && typeof exercises === 'object') {
        for (const [exId, done] of Object.entries(exercises)) {
          if (done) {
            await sql`
              INSERT INTO public.workout_log_exercises (log_id, exercise_id, done) 
              VALUES (${logId}, ${exId}, true)
            `;
          }
        }
      }

      return NextResponse.json({ success: true, logId });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    console.error('Neon Database API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Interal database error' 
    }, { status: 500 });
  }
}
