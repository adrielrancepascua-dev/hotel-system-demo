export function PanelSkeleton({ label }: { label: string }) {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only">{label}</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="hotel-skeleton h-14 sm:h-16" />
        <div className="hotel-skeleton h-14 sm:h-16" />
        <div className="hotel-skeleton h-14 sm:h-16" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-3">
        <div className="hotel-skeleton h-24 sm:h-32" />
        <div className="hotel-skeleton h-24 sm:h-32" />
        <div className="hotel-skeleton hidden h-32 sm:block" />
        <div className="hotel-skeleton hidden h-32 sm:block" />
      </div>
    </section>
  );
}
