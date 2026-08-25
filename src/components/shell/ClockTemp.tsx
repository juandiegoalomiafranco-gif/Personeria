"use client";

import { useEffect, useState } from "react";
import { useContent } from "@/providers/LocaleProvider";

/** Bogotá no tiene horario de verano, así que el offset es fijo. */
const TIME_ZONE = "America/Bogota";

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(date);
}

/**
 * Zona horaria, hora local y temperatura real, como el `GMT+8 CN 22:27 31°C`
 * de la referencia.
 *
 * El reloj arranca en `--:--` y solo se llena en el cliente: renderizar la hora
 * del servidor desincronizaría la hidratación. Si el clima falla, la
 * temperatura simplemente no aparece — nunca bloquea el resto de la barra.
 */
export function ClockTemp({ className }: { className?: string }) {
  const { chrome } = useContent();
  const [time, setTime] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setTime(formatTime(new Date()));
    update();

    // Alineamos el primer tick al cambio de minuto para no ir un poco tarde.
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      update();
      interval = setInterval(update, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { latitude, longitude } = chrome.weather;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;

    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("weather"))))
      .then((data: { current?: { temperature_2m?: number } }) => {
        const value = data.current?.temperature_2m;
        if (typeof value === "number") setTemperature(Math.round(value));
      })
      .catch(() => {
        // Sin red o API caída: la barra se muestra sin temperatura.
      });

    return () => controller.abort();
  }, [chrome.weather]);

  return (
    <span className={className} suppressHydrationWarning>
      {chrome.timezoneLabel} {time ?? "--:--"}
      {temperature !== null ? ` ${temperature}°C` : ""}
    </span>
  );
}
