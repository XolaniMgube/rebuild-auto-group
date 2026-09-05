"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { MobileHeader, PageHead } from "@/components/Shell";
import { Button, Field, Input, Segmented, Select, Textarea } from "@/components/ui";
import { fileToCompressedDataUrl } from "@/lib/image";
import { carName } from "@/lib/format";
import type { Condition } from "@/lib/types";

export default function AddPartPage() { return <Suspense><AddPartForm/></Suspense>; }
function AddPartForm() {
  const params = useSearchParams();
  const router = useRouter();
  const vehicles = useStore((s) => s.vehicles);
  const addPart = useStore((s) => s.addPart);

  const fileInput = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [vehicleId, setVehicleId] = useState<string>(vehicles.some(v => v.id === params.get("car")) ? params.get("car")! : "");
  const [name, setName] = useState("");
  const [condition, setCondition] = useState<Condition>("GOOD");
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [serial, setSerial] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const shots = await Promise.all(files.map(fileToCompressedDataUrl));
      setImages((prev) => [...prev, ...shots].slice(0, 4));
    } catch {
      setError("Couldn't read that photo. Try another one.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  function save() {
    if (!name.trim()) {
      setError("Give the part a name so it can be found later.");
      return;
    }
    if (busy) return;
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) { setError("Quantity must be a whole number of at least 1."); return; }
    const id = addPart({
      name: name.trim(),
      brand: brand.trim() || null,
      serialNumber: serial.trim() || null,
      condition,
      description: description.trim() || null,
      quantity: Math.max(1, Number(quantity) || 1),
      location: location.trim() || null,
      status: "IN_STOCK",
      images,
      vehicleId: vehicleId || null,
    });
    router.push(`/parts/${id}?added=1`);
  }

  return (
    <>
      <MobileHeader title="New part" />
      <PageHead
        title="Add a part"
        crumb=""
        actions={
          <>
            <Button disabled={busy} onClick={save}>Add part</Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto lg:p-6">
        <div className="lg:max-w-[620px] lg:mx-auto lg:rounded-xl lg:border lg:border-hairline lg:bg-white lg:p-6 lg:space-y-5">
          {/* photos */}
          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <p className="text-xs font-semibold text-slate mb-1.5">Photos</p>
            <div className="flex gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover bg-paper"
                  />
                  <button
                    onClick={() => setImages(images.filter((_, x) => x !== i))}
                    className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-ink text-white text-xs grid place-items-center"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  onClick={() => fileInput.current?.click()}
                  disabled={busy}
                  className="h-16 w-16 rounded-lg border-[1.5px] border-dashed border-hairline grid place-items-center text-mist hover:border-brand-blue hover:text-brand-blue transition"
                  aria-label="Take a photo"
                >
                  {busy ? (
                    <span className="h-4 w-4 rounded-full border-2 border-hairline border-t-brand-blue animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                      <path
                        d="M4 8h3l1.5-2h7L17 8h3v11H4V8z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <p className="text-[11.5px] text-mist mt-2">
              Up to 4 photos.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={onPickPhoto}
              className="hidden"
            />
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <Field label="Car project">
              <Select
                value={vehicleId}
                onChange={(e) =>
                  setVehicleId((e.target as HTMLSelectElement).value)
                }
              >
                <option value="">Unassigned stock</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {carName(v)}
                  </option>
                ))}
              </Select>
            </Field>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <Field label="What is it">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Headlight, left"
              />
            </Field>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <p className="text-xs font-semibold text-slate mb-1.5">Condition</p>
            <Segmented
              value={condition}
              onChange={setCondition}
              options={[
                { value: "GOOD", label: "Good" },
                { value: "FAIR", label: "Fair" },
                { value: "SPARES_ONLY", label: "Spares" },
              ]}
            />
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <Field label="Where">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Rack B3"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <Field label="Brand">
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
              <div className="w-[92px]">
                <Field label="How many">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <Field label="Part number">
              <Input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </section>

          <section className="bg-white px-4 py-3.5 border-b border-hairline lg:border-0 lg:p-0">
            <Field label="Notes">
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fitment notes, test results, or anything to remember"
              />
            </Field>
          </section>

          {error && (
            <p className="mx-4 lg:mx-0 mt-3 text-[13px] font-semibold text-brand-red bg-brand-redTint rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <div className="lg:hidden sticky bottom-0 z-10 bg-white px-4 py-3 border-t border-hairline flex gap-2.5">
            <Button disabled={busy} className="flex-1" onClick={save}>Add part</Button>
          </div>
        </div>
      </div>
    </>
  );
}
