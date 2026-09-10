import { BrandIcon } from "./Logo";

export function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  return <div role="status" aria-live="polite" aria-label="Loading Rebuild Auto Group" aria-busy="true"
    className={`grid place-items-center bg-canvas ${fullScreen ? "min-h-dvh" : "min-h-[240px] flex-1"}`}>
    <div className="brand-loader" aria-hidden="true">
      <div className="brand-loader-ring" />
      <BrandIcon priority className="brand-loader-icon h-16 w-16" />
    </div>
  </div>;
}
