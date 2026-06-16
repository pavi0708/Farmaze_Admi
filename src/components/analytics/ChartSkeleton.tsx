/**
 * ChartSkeleton — reusable skeleton loader for chart components.
 */
interface ChartSkeletonProps {
  type?: 'area' | 'bar' | 'donut' | 'table';
  height?: number;
}

export default function ChartSkeleton({ type = 'area', height = 300 }: ChartSkeletonProps) {
  if (type === 'donut') {
    return (
      <div className="flex flex-col items-center justify-center animate-pulse" style={{ height }}>
        <div className="w-40 h-40 rounded-full border-[20px] border-muted" />
        <div className="mt-6 space-y-2 w-full px-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
              <div className="h-3 bg-muted rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="flex items-end justify-around gap-3 px-8 animate-pulse" style={{ height }}>
        {[65, 85, 45, 95, 70, 55, 80].map((h, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse space-y-2" style={{ minHeight: height }}>
        <div className="h-8 bg-muted/50 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-muted/30 rounded" />
        ))}
      </div>
    );
  }

  // Default: area chart skeleton
  return (
    <div className="relative animate-pulse" style={{ height }}>
      <div className="absolute inset-0 flex items-end px-8">
        <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,180 C50,160 80,100 120,120 C160,140 200,60 240,80 C280,100 320,40 360,60 L400,70 L400,200 L0,200Z"
            fill="hsl(var(--muted))"
            opacity="0.5"
          />
        </svg>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-2 bg-muted rounded w-8" />
        ))}
      </div>
    </div>
  );
}
