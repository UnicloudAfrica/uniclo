export default function AuthBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--theme-color-900))] via-[rgb(var(--theme-color-800))] to-[rgb(var(--secondary-color-900))]" />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
