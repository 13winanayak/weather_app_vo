import type { NextRequest } from "next/server"

// Backend-for-Frontend Route Handler that securely calls OpenWeatherMap using a server-side API key.
// This keeps your API key off the client.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { city?: string } | null
    const city = body?.city?.trim()
    if (!city) {
      return Response.json({ error: "City is required." }, { status: 400 })
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      // Avoid leaking sensitive details to users in production; this message is for dev convenience.
      return Response.json(
        { error: "Server is missing OpenWeather API key. Set OPENWEATHER_API_KEY in your environment." },
        { status: 500 },
      )
    }

    const params = new URLSearchParams({
      q: city,
      appid: apiKey,
      units: "metric",
    })
    const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
    const res = await fetch(url)

    // Forward 404 for city not found and other non-OK statuses with user-friendly message
    if (!res.ok) {
      let message = "Failed to fetch weather."
      try {
        const j = await res.json()
        if (typeof j?.message === "string") {
          message = j.message
        }
      } catch {
        // ignore
      }
      return Response.json({ error: message }, { status: res.status })
    }

    const data = await res.json()

    const payload = {
      city: data?.name ?? city,
      country: data?.sys?.country ?? "",
      tempC: Math.round(Number(data?.main?.temp ?? 0)),
      feelsC: Math.round(Number(data?.main?.feels_like ?? 0)),
      condition: data?.weather?.[0]?.main ?? "",
      description: data?.weather?.[0]?.description ?? "",
      icon: data?.weather?.[0]?.icon ?? "01d",
      humidity: Number(data?.main?.humidity ?? 0),
      windKmh: Math.round(Number(data?.wind?.speed ?? 0) * 3.6), // m/s -> km/h
      sunrise: Number(data?.sys?.sunrise ?? 0), // unix UTC
      sunset: Number(data?.sys?.sunset ?? 0), // unix UTC
      timezone: Number(data?.timezone ?? 0), // seconds offset from UTC
      dt: Number(data?.dt ?? Math.floor(Date.now() / 1000)),
    }

    return Response.json(payload, { status: 200 })
  } catch (err) {
    return Response.json({ error: "Unexpected server error fetching weather." }, { status: 500 })
  }
}
