import type { KeyboardEvent, ReactNode } from 'react'
import type { StepPlayerApi } from '@/hooks/useStepPlayer'
import { ChevronLeft, ChevronRight, Pause, Play, Reset } from './Icons'
import './StepPlayer.css'

export interface StepPlayerProps {
  player: StepPlayerApi
  /** "Why" narration for the current step. */
  caption?: ReactNode
  /** Short label for the current step, e.g. "Predict" / "Update". */
  stepLabel?: string
  /** Selectable playback speeds. */
  speeds?: number[]
  /** Show the clickable dot track. Default: true. */
  showProgress?: boolean
  className?: string
}

const DEFAULT_SPEEDS = [0.5, 1, 2, 4]

export function StepPlayer({
  player,
  caption,
  stepLabel,
  speeds = DEFAULT_SPEEDS,
  showProgress = true,
  className,
}: StepPlayerProps) {
  const { index, numSteps, isPlaying, speed, isFirst, isLast } = player

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        player.next()
        break
      case 'ArrowLeft':
        e.preventDefault()
        player.prev()
        break
      case ' ':
      case 'Spacebar':
        e.preventDefault()
        player.toggle()
        break
      case 'Home':
        e.preventDefault()
        player.reset()
        break
    }
  }

  return (
    <div
      className={`step-player${className ? ` ${className}` : ''}`}
      role="group"
      aria-label="Step controls"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="sp-transport">
        <button
          className="sp-btn"
          onClick={player.reset}
          disabled={isFirst && !isPlaying}
          aria-label="Reset to start"
          title="Reset (Home)"
        >
          <Reset size={17} />
        </button>
        <button
          className="sp-btn"
          onClick={player.prev}
          disabled={isFirst}
          aria-label="Previous step"
          title="Previous (←)"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="sp-btn sp-btn--primary"
          onClick={player.toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title="Play / pause (Space)"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          className="sp-btn"
          onClick={player.next}
          disabled={isLast}
          aria-label="Next step"
          title="Next (→)"
        >
          <ChevronRight size={20} />
        </button>

        <div className="sp-counter mono" aria-live="polite">
          <span className="sp-counter-cur">{numSteps === 0 ? 0 : index + 1}</span>
          <span className="sp-counter-sep">/</span>
          <span className="sp-counter-total">{numSteps}</span>
        </div>

        <div className="sp-speed" role="group" aria-label="Playback speed">
          {speeds.map((s) => (
            <button
              key={s}
              className={`sp-speed-btn${s === speed ? ' is-active' : ''}`}
              onClick={() => player.setSpeed(s)}
              aria-pressed={s === speed}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {showProgress && numSteps > 1 && (
        <div className="sp-track" role="group" aria-label="Steps">
          {Array.from({ length: numSteps }, (_, i) => (
            <button
              key={i}
              className={`sp-dot${i === index ? ' is-current' : ''}${i < index ? ' is-done' : ''}`}
              onClick={() => player.goTo(i)}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}

      {(stepLabel || caption) && (
        <div className="sp-caption">
          {stepLabel && <span className="sp-step-label">{stepLabel}</span>}
          {caption && <div className="sp-caption-body">{caption}</div>}
        </div>
      )}
    </div>
  )
}
