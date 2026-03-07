import { useState, useEffect, useCallback } from 'react'

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isOver: boolean
}

/**
 * Hook que retorna o tempo restante até `targetDate` (ISO 8601: 'YYYY-MM-DD').
 * Atualiza a cada segundo via setInterval.
 * Quando a data já passou, retorna isOver = true e todos os campos = 0.
 *
 * @example
 * const { days, hours, minutes, seconds, isOver } = useCountdown('2026-11-07')
 */
export function useCountdown(targetDate: string): CountdownResult {
  const getTimeLeft = useCallback((): CountdownResult => {
    // Força meia-noite local para evitar drift de fuso horário
    const target = new Date(`${targetDate}T18:00:00`).getTime()
    const diff = target - Date.now()

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true }
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isOver: false,
    }
  }, [targetDate])

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(getTimeLeft)

  useEffect(() => {
    setTimeLeft(getTimeLeft())
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [getTimeLeft])

  return timeLeft
}
