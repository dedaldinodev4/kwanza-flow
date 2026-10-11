
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-caption text-destructive mt-1.5 font-medium">
      {message}
    </p>
  );
}
