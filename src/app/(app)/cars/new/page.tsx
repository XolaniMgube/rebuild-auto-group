"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { MobileHeader, PageHead } from "@/components/Shell";
import { Button, Field, Input, Textarea } from "@/components/ui";

export default function NewCarPage() {
  const router = useRouter();
  const addVehicle = useStore((s) => s.addVehicle);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!make.trim() || !model.trim()) {
      setError("Make and model are needed so parts can be matched to it.");
      return;
    }
    if (year && (!Number.isInteger(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 1)) { setError("Enter a valid car year."); return; }
    const id = addVehicle({
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : null,
      vin: vin.trim() || null,
      registration: registration.trim() || null,
      color: color.trim() || null,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString(),
      notes: notes.trim() || null,
    });
    router.push(`/cars/${id}`);
  }

  return (
    <>
      <MobileHeader title="New car project" />
      <PageHead
        title="New car project"
        crumb=""
        actions={<Button onClick={save}>Create project</Button>}
      />

      <div className="flex-1 overflow-y-auto lg:p-6">
        <div className="lg:max-w-[620px] lg:mx-auto lg:rounded-xl lg:border lg:border-hairline lg:bg-white lg:p-6 lg:space-y-5">
          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <Field label="Make">
                  <Input
                    value={make}
                    onChange={(e) => {
                      setMake(e.target.value);
                      setError(null);
                    }}
                    placeholder="VW"
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Model">
                  <Input
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setError(null);
                    }}
                    placeholder="Polo Vivo"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <div className="flex gap-2.5">
              <div className="w-[110px]">
                <Field label="Year">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2012"
                  />
                </Field>
              </div>

            </div>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <Field label="Registration">
                  <Input
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Colour">
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <Field label="VIN / chassis number">
              <Input
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <Field label="Notes">
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are you planning for this car?"
              />
            </Field>
          </section>

          {error && (
            <p className="mx-4 lg:mx-0 mt-3 text-[13px] font-semibold text-brand-red bg-brand-redTint rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <div className="lg:hidden sticky bottom-0 z-10 bg-white px-4 py-3 border-t border-hairline">
            <Button className="w-full" onClick={save}>
              Create project
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
