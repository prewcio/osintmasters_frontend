import AnimatedButton from "@/components/animated-button"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
      <h1 className="text-6xl font-bold mb-12 tracking-wider glitch">OSINT MASTERS</h1>
      <p className="text-base mb-16 max-w-4xl text-center leading-relaxed typing">
        OSINT Masters to studenckie kółko naukowe działające w Akademii Ekonomiczno-Humanistycznej w Warszawie. Naszym
        celem jest zgłębianie i praktyczne zastosowanie metod Open Source Intelligence (OSINT) – czyli analizy i
        zbierania informacji z ogólnodostępnych źródeł. W ramach naszych działań organizujemy warsztaty, prelekcje oraz
        projekty badawcze, które pozwalają studentom rozwijać umiejętności analityczne, techniczne oraz strategiczne.
        OSINT Masters to idealne miejsce dla tych, którzy chcą poszerzyć swoją wiedzę o nowoczesnych narzędziach
        wywiadowczych i zdobyć cenne doświadczenie w praktycznym wykorzystaniu informacji.
      </p>
      <div className="flex gap-8">
        <AnimatedButton href="/login">ZALOGUJ SIĘ</AnimatedButton>
        <AnimatedButton href="/register">DOŁĄCZ DO NAS</AnimatedButton>
      </div>
    </main>
  )
}

