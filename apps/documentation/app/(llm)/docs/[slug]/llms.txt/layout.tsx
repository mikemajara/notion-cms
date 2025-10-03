import "@/styles/globals.css"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden touch-manipulation">
      <body>{children}</body>
    </html>
  )
}
