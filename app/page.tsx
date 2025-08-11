"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

type WeatherPayload = {
  city: string
  country: string
  tempC: number
  feelsC: number
  condition: string
  description: string
  icon: string
  humidity: number
  windKmh: number
  sunrise: number // unix (UTC)
  sunset: number // unix (UTC)
  timezone: number // offset seconds from UTC
  dt: number // current time unix (UTC)
}

export default function Page() {
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WeatherPayload | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const query = city.trim()
    if (!query) {
      setError("Please enter a city name.")
      return
    }
    setLoading(true)
    setError(null)
    setData(null) // Clear previous data on a new search

    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: query }),
      })

      if (!res.ok) {
        let message = "Failed to fetch weather."
        try {
          const j = await res.json()
          if (j?.error) message = j.error
        } catch {
          // ignore
        }
        if (res.status === 404) message = "City not found. Please check the spelling and try again."
        throw new Error(message)
      }

      const payload = (await res.json()) as WeatherPayload
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const bgClass = getBackgroundClass(data?.condition)

  return (
    <main className={`min-h-[100dvh] transition-colors ${bgClass}`}>
      <section className="container max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Weather Now</h1>
          <p className="text-muted-foreground mt-2">Get real-time weather by city.</p>
        </header>

        <form onSubmit={onSubmit} className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <Input
              aria-label="City"
              placeholder="Type a city, e.g., Tokyo"
              className="pl-9"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading || !city.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Oops</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading weather" />
          </div>
        )}

        {data && <WeatherCard weather={data} />}

        {!loading && !data && !error && (
          <p className="text-center text-muted-foreground">Search for a city to see the current weather.</p>
        )}
      </section>
    </main>
  )
}

function WeatherCard({ weather }: { weather: WeatherPayload }) {
  const localDateTime = formatLocalDateTime(weather.dt, weather.timezone)
  const sunriseTime = formatLocalTime(weather.sunrise, weather.timezone)
  const sunsetTime = formatLocalTime(weather.sunset, weather.timezone)

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`
  const alt = `Weather icon showing ${weather.description}`

  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span>{weather.city}</span>
          <Badge variant="secondary" className="text-xs">
            {weather.country || "—"}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Local time: {localDateTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Image
                src={iconUrl || "/placeholder.svg"}
                alt={alt}
                width={160}
                height={160}
                priority
                className="select-none"
              />
            </div>
            <div className="mt-2">
              <p className="text-xl font-semibold">{weather.condition || "—"}</p>
              <p className="text-muted-foreground capitalize">{weather.description || ""}</p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-bold">{weather.tempC ?? "—"}</span>
              <span className="text-2xl sm:text-3xl text-muted-foreground">°C</span>
            </div>
            <p className="text-muted-foreground mt-2">
              Feels like <span className="font-medium">{weather.feelsC}°C</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <Stat label="Humidity" value={`${weather.humidity}%`} />
              <Stat label="Wind" value={`${weather.windKmh} km/h`} />
              <Stat label="Sunrise" value={sunriseTime} />
              <Stat label="Sunset" value={sunsetTime} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2 text-center sm:text-left">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  )
}

/**
 * Choose a pleasant background based on the main weather condition.
 * Avoids strong blues by preferring warm/neutral gradients.
 */
function getBackgroundClass(condition?: string) {
  const c = (condition || "").toLowerCase()
  if (c.includes("clear")) {
    return "bg-gradient-to-b from-yellow-50 to-amber-100"
  }
  if (c.includes("cloud")) {
    return "bg-gradient-to-b from-zinc-100 to-zinc-200"
  }
  if (c.includes("rain") || c.includes("drizzle")) {
    return "bg-gradient-to-b from-slate-100 to-slate-200"
  }
  if (c.includes("thunder")) {
    return "bg-gradient-to-b from-stone-100 to-stone-200"
  }
  if (c.includes("snow")) {
    return "bg-gradient-to-b from-neutral-100 to-neutral-200"
  }
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke")) {
    return "bg-gradient-to-b from-gray-100 to-gray-200"
  }
  return "bg-gradient-to-b from-gray-50 to-gray-100"
}

/**
 * Format a full local date and time string for the city's timezone.
 * We adjust the unix timestamp by the timezone offset and then format as UTC.
 */
function formatLocalDateTime(unixSeconds: number, timezoneOffsetSeconds: number) {
  const d = new Date((unixSeconds + timezoneOffsetSeconds) * 1000)
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
}

/**
 * Format a local time (HH:mm) for sunrise/sunset.
 */
function formatLocalTime(unixSeconds: number, timezoneOffsetSeconds: number) {
  const d = new Date((unixSeconds + timezoneOffsetSeconds) * 1000)
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
}
