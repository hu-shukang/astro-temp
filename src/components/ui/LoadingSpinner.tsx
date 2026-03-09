interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`border-primary animate-spin rounded-full border-2 border-t-transparent ${SIZE_CLASS[size]}`}
        role="status"
        aria-label="読み込み中"
      />
    </div>
  );
}
