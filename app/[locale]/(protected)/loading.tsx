export default function ProtectedLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-ui-border" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-ap-blue animate-spin" />
        </div>
        <p className="text-[13px] font-medium text-ui-text-soft animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
