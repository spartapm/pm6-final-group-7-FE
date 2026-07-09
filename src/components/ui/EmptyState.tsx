interface Props {
  message?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, title, description, actionLabel, onAction }: Props) {
  const displayMessage = message ?? title;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {displayMessage && <p className="text-base font-semibold text-text-primary">{displayMessage}</p>}
      {description && <p className="mt-2 text-sm text-text-muted">{description}</p>}
      {actionLabel && onAction && (
        <button
          className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
