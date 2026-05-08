export default function ProtectedLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-border-default" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin" />
        </div>
        <p className="text-[13px] font-medium text-text-default animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
