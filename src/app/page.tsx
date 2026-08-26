import Link from "next/link";

export default function Home() {
  return (
      <main className="min-h-screen bg-white text-zinc-900">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
            <Link
                href="/"
                className="text-xl font-bold tracking-tight"
            >
              LingoLearn
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log in
              </Link>

              <Link
                  href="/register"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Get started
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pt-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600">
              Learn languages your way
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Learn a language.
              <br />
              Build it into a habit.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Learn vocabulary, complete lessons, practice with exercises,
              and track your progress from one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                  href="/register"
                  className="rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Start learning
              </Link>

              <Link
                  href="/languages"
                  className="rounded-xl border border-zinc-300 px-6 py-3.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Explore languages
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <FeatureCard
                title="Structured courses"
                description="Move through courses, units, and lessons in a clear learning path."
            />

            <FeatureCard
                title="Practice"
                description="Strengthen what you learn with vocabulary and interactive exercises."
            />

            <FeatureCard
                title="Track progress"
                description="Keep your learning journey measurable with lesson and course progress."
            />
          </div>
        </section>
      </main>
  );
}

function FeatureCard({
                       title,
                       description,
                     }: {
  title: string;
  description: string;
}) {
  return (
      <div className="rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {description}
        </p>
      </div>
  );
}