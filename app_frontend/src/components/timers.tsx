import { useEffect } from 'react';

import { useLogStudySession } from '@/api/study';
import { useStudyStore } from '@/store/study';
import { useTrainingStore } from '@/store/training';

/**
 * Único dono dos cronômetros. Montado uma vez no layout raiz: antes, Home e a aba
 * de Estudo/Treino tinham cada uma o seu setInterval e, com ambas montadas, o
 * relógio descontava 2 s por segundo.
 */
export function Timers() {
  const { mutate: logStudySession } = useLogStudySession();
  const studyRunning = useStudyStore((s) => !!s.session?.running);
  const trainingActive = useTrainingStore((s) => !!s.session);

  useEffect(() => {
    if (!studyRunning) return;
    const id = setInterval(() => {
      // Ciclo que fecha sozinho também é registrado no servidor
      const elapsed = useStudyStore.getState().tick();
      if (elapsed) logStudySession({ seconds: elapsed.seconds, subjectId: elapsed.subjectId });
    }, 1000);
    return () => clearInterval(id);
  }, [studyRunning, logStudySession]);

  useEffect(() => {
    if (!trainingActive) return;
    const id = setInterval(useTrainingStore.getState().tick, 1000);
    return () => clearInterval(id);
  }, [trainingActive]);

  return null;
}
