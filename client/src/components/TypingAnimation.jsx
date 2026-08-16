import { useEffect, useMemo, useRef, useState } from 'react';

const TAGS = ['article', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'p', 'section', 'span'];

/**
 * Magic-UI style typing animation.
 * Types out `children` (or cycles through `words`) character by character,
 * with an optional blinking cursor. Adapted to plain React + Tailwind:
 * no framer-motion, no `cn` util — IntersectionObserver for start-on-view.
 */
export default function TypingAnimation({
  children,
  words,
  className = '',
  duration = 100,
  typeSpeed,
  deleteSpeed,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as = 'span',
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = 'line',
  cursorClassName = '',
  ...props
}) {
  const Tag = TAGS.includes(as) ? as : 'span';
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [phase, setPhase] = useState('typing'); // typing | pause | deleting
  const [inView, setInView] = useState(false);
  const elementRef = useRef(null);

  const wordsToAnimate = useMemo(() => words ?? (children ? [children] : []), [words, children]);
  const hasMultipleWords = wordsToAnimate.length > 1;

  const typingSpeed = typeSpeed ?? duration;
  const deletingSpeed = deleteSpeed ?? typingSpeed / 2;
  const shouldStart = startOnView ? inView : true;

  const animationSourceKey = useMemo(() => (words ? words.join('\u0000') : children ?? ''), [words, children]);

  // Reset whenever the source text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setPhase('typing');
  }, [animationSourceKey]);

  // Start-on-view detection
  useEffect(() => {
    if (!startOnView) {
      setInView(true);
      return;
    }
    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView]);

  // Typing loop
  useEffect(() => {
    if (!shouldStart || wordsToAnimate.length === 0) return;

    const timeoutDelay =
      delay > 0 && displayedText === ''
        ? delay
        : phase === 'typing'
          ? typingSpeed
          : phase === 'deleting'
            ? deletingSpeed
            : pauseDelay;

    const timeout = setTimeout(() => {
      const currentWord = wordsToAnimate[currentWordIndex] || '';
      const graphemes = Array.from(currentWord);

      switch (phase) {
        case 'typing':
          if (currentCharIndex < graphemes.length) {
            setDisplayedText(graphemes.slice(0, currentCharIndex + 1).join(''));
            setCurrentCharIndex((c) => c + 1);
          } else if (hasMultipleWords || loop) {
            const isLastWord = currentWordIndex === wordsToAnimate.length - 1;
            if (!isLastWord || loop) setPhase('pause');
          }
          break;
        case 'pause':
          setPhase('deleting');
          break;
        case 'deleting':
          if (currentCharIndex > 0) {
            setDisplayedText(graphemes.slice(0, currentCharIndex - 1).join(''));
            setCurrentCharIndex((c) => c - 1);
          } else {
            setCurrentWordIndex((i) => (i + 1) % wordsToAnimate.length);
            setPhase('typing');
          }
          break;
        default:
          break;
      }
    }, timeoutDelay);

    return () => clearTimeout(timeout);
  }, [
    shouldStart,
    phase,
    currentCharIndex,
    currentWordIndex,
    displayedText,
    wordsToAnimate,
    hasMultipleWords,
    loop,
    typingSpeed,
    deletingSpeed,
    pauseDelay,
    delay,
  ]);

  const currentWordGraphemes = Array.from(wordsToAnimate[currentWordIndex] || '');
  const isComplete =
    !loop &&
    currentWordIndex === wordsToAnimate.length - 1 &&
    currentCharIndex >= currentWordGraphemes.length &&
    phase !== 'deleting';

  const shouldShowCursor =
    showCursor &&
    !isComplete &&
    (hasMultipleWords || loop || currentCharIndex < currentWordGraphemes.length);

  const cursorChar = cursorStyle === 'block' ? '▌' : cursorStyle === 'underscore' ? '_' : '|';

  return (
    <Tag
      ref={elementRef}
      className={`tracking-[-0.02em] ${Tag === 'span' ? 'inline-block' : ''} ${className}`}
      {...props}
    >
      {displayedText}
      {shouldShowCursor ? (
        <span className={`inline-block ${blinkCursor ? 'animate-blink-cursor' : ''} ${cursorClassName}`}>{cursorChar}</span>
      ) : null}
    </Tag>
  );
}
