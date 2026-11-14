import { motion, useReducedMotion } from 'motion/react';

/** Texte qui apparaît mot à mot (sous-titre toujours lisible en entier si mouvement réduit). */
export function SpeechText({ text, className = '' }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <p className={className}>{text}</p>;
  const words = text.split(' ');
  return (
    <p className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={`${text.length}-${i}`}
          aria-hidden="true"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.035, duration: 0.25 }}
        >
          {w}{' '}
        </motion.span>
      ))}
    </p>
  );
}
