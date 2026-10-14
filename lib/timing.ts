// Logs how long a step takes, so slow pages can be diagnosed from the
// Vercel logs (look for lines starting "[timing]").
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`[timing] ${label} ${Date.now() - start}ms`);
  }
}
