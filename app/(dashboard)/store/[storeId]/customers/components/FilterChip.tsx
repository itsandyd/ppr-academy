export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-8 px-4 rounded-full border ${
        active
          ? 'border-[#6356FF] text-[#6356FF]'
          : 'border-dashed border-[#BFC5E9] text-[#4B4E68] hover:bg-[#F1F2FF] hover:border-solid'
      } text-sm font-medium transition-colors`}
    >
      {label}
    </button>
  );
} 