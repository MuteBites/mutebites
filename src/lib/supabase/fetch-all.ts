/**
 * PostgREST caps every response at 1000 rows (the project's max_rows) and
 * quietly drops the rest, even when the query asks for more with .limit().
 * This pages through a query until it's done: `page(from, to)` runs the
 * query for that inclusive range, and it must have a stable order (end on a
 * unique column), or rows can repeat or go missing between pages.
 */
export const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  max = Infinity,
): Promise<T[]> {
  const rows: T[] = [];
  while (rows.length < max) {
    const from = rows.length;
    const size = Math.min(PAGE_SIZE, max - from);
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return rows;
}
