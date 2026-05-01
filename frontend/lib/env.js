export function hasUsableDatabaseUrl() {
  const value = process.env.DATABASE_URL || '';
  return Boolean(
    value &&
      !value.includes('[PROJECT]') &&
      !value.includes('[PASSWORD]') &&
      !value.includes('your_') &&
      !value.includes('example')
  );
}
