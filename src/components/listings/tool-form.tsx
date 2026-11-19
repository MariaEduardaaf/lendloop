"use client";

import { useState, type FormEvent } from "react";
import { LIMITS } from "@convex/lib/validators";
import { CATEGORIES, CATEGORY_LABELS, CONDITIONS, CONDITION_LABELS, type Category, type Condition } from "@/lib/labels";
import { useAction } from "@/lib/use-action";
import { Button } from "../button";
import { ErrorText } from "../feedback";
import { Field, inputClass } from "../field";

export type ToolValues = { name: string; category: Category; condition: Condition; description: string };

type Props = {
  initial?: ToolValues;
  submitLabel: string;
  onSubmit: (values: ToolValues) => Promise<unknown>;
  onDone: () => void;
};

// A new listing starts with no category or condition, so nobody files a tool under a silent default.
type FormValues = Omit<ToolValues, "category" | "condition"> & { category: Category | ""; condition: Condition | "" };
const EMPTY: FormValues = { name: "", category: "", condition: "", description: "" };

/** Create and edit share this form: the parent decides which mutation runs on submit. */
export function ToolForm({ initial, submitLabel, onSubmit, onDone }: Props) {
  const [values, setValues] = useState<FormValues>(initial ?? EMPTY);
  const { pending, error, run } = useAction();
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { category, condition } = values;
    if (!category || !condition) return; // The required selects stop this first.
    if (await run(() => onSubmit({ ...values, category, condition }))) onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Name">
        <input
          autoFocus
          required
          maxLength={LIMITS.toolNameMax}
          className={inputClass}
          placeholder="Cordless drill"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select required className={inputClass} value={values.category} onChange={(e) => set("category", e.target.value as Category)}>
            <option value="" disabled>
              Choose...
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Condition">
          <select required className={inputClass} value={values.condition} onChange={(e) => set("condition", e.target.value as Condition)}>
            <option value="" disabled>
              Choose...
            </option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description" hint={`${values.description.length} / ${LIMITS.descriptionMax} characters`}>
        <textarea
          required
          rows={3}
          maxLength={LIMITS.descriptionMax}
          className={inputClass}
          placeholder="What it is, what comes with it, anything to know before using it"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
      <ErrorText message={error} />
    </form>
  );
}
