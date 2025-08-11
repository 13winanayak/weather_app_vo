"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, MapPin, Droplets, Wind, Sun, Sunset } from "lucide-react"
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
  sunrise: number
  sunset: number
  timezone: number
  dt: number
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
    setData(null)

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
        } catch {}
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
    <main className={`min-h-[100dvh] transition-colors duration-500 ${bgClass}`}>
      <section className="container max-w-3xl mx-auto px-4 py-10 sm:py-14" >
        <header className="mb-10 text-center">
  <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
    Weather Now
  </h1>
  <div className="w-24 h-1 mx-auto mt-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
  <p className="text-gray-600 mt-4 text-lg sm:text-xl italic">
    ☀️ Get <span className="font-semibold text-blue-500">real-time</span> weather updates by city 🌧️
  </p>
</header>


        <form
  onSubmit={onSubmit}
  className="flex gap-2 sm:gap-3 mb-8 bg-gradient-to-r from-blue-50/40 to-cyan-50/40 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl"
>
  {/* Input with icon */}
  <div className="relative flex-1">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
      <MapPin className="h-5 w-5" aria-hidden="true" />
    </span>
    <Input
      aria-label="City"
      placeholder="🌍 Search city (e.g., Tokyo)"
      className="pl-10 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all duration-200"
      value={city}
      onChange={(e) => setCity(e.target.value)}
    />
  </div>

  {/* Search button */}
  <Button
    type="submit"
    disabled={loading || !city.trim()}
    className="rounded-xl font-semibold px-6 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 shadow-md hover:shadow-lg transition-all duration-300 text-white"
  >
    {loading ? (
      <>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Searching...
      </>
    ) : (
      "🔍 Search"
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
          <p className="text-center text-muted-foreground text-lg">
            Search for a city to see the current weather.
          </p>
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
    <Card className="shadow-2xl rounded-3xl overflow-hidden border-0 bg-gradient-to-br from-blue-500/20 via-cyan-400/10 to-purple-500/20 backdrop-blur-md transition-transform hover:scale-[1.02] duration-300">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-3 text-3xl font-extrabold text-blue-900 drop-shadow-sm">
      <span>{weather.city}</span>
      <Badge
        variant="secondary"
        className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow-md"
      >
        {weather.country || "—"}
      </Badge>
    </CardTitle>
    <CardDescription className="flex items-center gap-2 text-lg text-blue-800/80 font-medium">
      <span
        className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"
        aria-hidden="true"
      />
      Local time: {localDateTime}
    </CardDescription>
  </CardHeader>

  <CardContent className="pt-0">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
      {/* Weather Icon & Description */}
      <div className="flex flex-col items-center text-center">
        <Image
          src={iconUrl || "/placeholder.svg"}
          alt={alt}
          width={160}
          height={160}
          priority
          className="select-none drop-shadow-lg animate-bounce"
        />
        <div className="mt-3">
          <p className="text-2xl font-bold text-purple-800">{weather.condition || "—"}</p>
          <p className="text-gray-700 capitalize">{weather.description || ""}</p>
        </div>
      </div>

      {/* Temperature & Stats */}
      <div className="flex flex-col items-center sm:items-start">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-bold text-blue-900 drop-shadow-md">
            {weather.tempC ?? "—"}
          </span>
          <span className="text-3xl text-gray-600">°C</span>
        </div>
        <p className="text-gray-700 mt-2 text-lg">
          Feels like{" "}
          <span className="font-semibold text-purple-700">{weather.feelsC}°C</span>
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 w-full">
          <Stat label="Humidity" value={`${weather.humidity}%`} icon={Droplets} color="bg-cyan-400" />
          <Stat label="Wind" value={`${weather.windKmh} km/h`} icon={Wind} color="bg-indigo-400" />
          <Stat label="Sunrise" value={sunriseTime} icon={Sun} color="bg-yellow-400" />
          <Stat label="Sunset" value={sunsetTime} icon={Sunset} color="bg-orange-400" />
        </div>
      </div>
    </div>
  </CardContent>
</Card>

  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white/50 backdrop-blur-sm px-4 py-3 shadow-sm">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
    </div>
  )
}

function getBackgroundClass(condition?: string) {
  const c = (condition || "").toLowerCase()
  if (c.includes("clear")) return "bg-gradient-to-br from-yellow-50 to-amber-100"
  if (c.includes("cloud")) return "bg-gradient-to-br from-zinc-100 to-zinc-300"
  if (c.includes("rain") || c.includes("drizzle")) return "bg-gradient-to-br from-slate-200 to-slate-400"
  if (c.includes("thunder")) return "bg-gradient-to-br from-stone-300 to-stone-500"
  if (c.includes("snow")) return "bg-gradient-to-br from-neutral-100 to-neutral-300"
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke"))
    return "bg-gradient-to-br from-gray-100 to-gray-300"
  return "bg-gradient-to-br from-gray-50 to-gray-200"
}

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

function formatLocalTime(unixSeconds: number, timezoneOffsetSeconds: number) {
  const d = new Date((unixSeconds + timezoneOffsetSeconds) * 1000)
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
}
