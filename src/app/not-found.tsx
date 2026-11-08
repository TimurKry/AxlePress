import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-muted">Seite nicht gefunden · Page not found</p>
      <Link href="/" className="text-accent underline">
        TruckPressure
      </Link>
    </main>
  );
}
