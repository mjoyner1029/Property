export function toUserMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return (
    error?.data?.message ||
    error?.message ||
    fallback
  );
}
