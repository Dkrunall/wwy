// Browser-side stand-in for the Supabase client, used only by the OMS pages.
// Same chainable API (`omsDb.from("orders").select(...).eq(...)`), but each query is sent to
// /api/oms/db, which runs it server-side after checking the admin session.

type Result = { data: any; error: any; count: number | null }; // eslint-disable-line @typescript-eslint/no-explicit-any

class OmsQuery implements PromiseLike<Result> {
  private ops: { m: string; a: unknown[] }[] = [];
  constructor(private table: string) {}

  private add(m: string, a: unknown[]): this {
    this.ops.push({ m, a });
    return this;
  }

  select(...a: unknown[]) { return this.add("select", a); }
  insert(...a: unknown[]) { return this.add("insert", a); }
  update(...a: unknown[]) { return this.add("update", a); }
  upsert(...a: unknown[]) { return this.add("upsert", a); }
  delete(...a: unknown[]) { return this.add("delete", a); }
  eq(...a: unknown[]) { return this.add("eq", a); }
  in(...a: unknown[]) { return this.add("in", a); }
  not(...a: unknown[]) { return this.add("not", a); }
  order(...a: unknown[]) { return this.add("order", a); }
  limit(...a: unknown[]) { return this.add("limit", a); }
  single() { return this.add("single", []); }
  maybeSingle() { return this.add("maybeSingle", []); }

  private async run(): Promise<Result> {
    try {
      const res = await fetch("/api/oms/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: this.table, ops: this.ops }),
      });
      const json = await res.json().catch(() => null);
      if (!json) return { data: null, error: { message: `Request failed (${res.status})` }, count: null };
      return { data: json.data ?? null, error: json.error ?? null, count: json.count ?? null };
    } catch {
      return { data: null, error: { message: "Network error" }, count: null };
    }
  }

  then<R1 = Result, R2 = never>(
    onfulfilled?: ((value: Result) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export const omsDb = {
  from: (table: string) => new OmsQuery(table),
};
