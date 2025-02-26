import PageTransition from "@/components/page-transition"
import LiveChat from "@/components/live-chat"

export default function ChatPage() {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 glitch">Chat</h2>
        <LiveChat />
      </div>
    </PageTransition>
  )
}

