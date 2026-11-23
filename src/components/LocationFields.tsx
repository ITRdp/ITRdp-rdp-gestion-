"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/select";
import { daneDepartments, daneMunicipalities } from "@/lib/dane";

export function LocationFields({
  departmentDefault,
  cityDefault,
  departmentName = "department",
  cityName = "city",
  cityLabel = "Municipio / ciudad",
  persistDepartment = true,
}: {
  departmentDefault?: string | null;
  cityDefault?: string | null;
  departmentName?: string;
  cityName?: string;
  cityLabel?: string;
  /** Si false, el departamento solo filtra municipios (no se envía en el form). */
  persistDepartment?: boolean;
}) {
  const departments = useMemo(() => daneDepartments(), []);
  const [department, setDepartment] = useState(departmentDefault ?? "");
  const [city, setCity] = useState(cityDefault ?? "");
  const municipalities = daneMunicipalities(department);

  const cityOptions = useMemo(() => {
    const opts = municipalities.map((m) => ({ value: m, label: m }));
    if (city && !municipalities.includes(city)) {
      opts.push({ value: city, label: `${city} (actual)` });
    }
    return opts;
  }, [municipalities, city]);

  return (
    <>
      <div className="field">
        <Label htmlFor={`${departmentName}-ui`}>Departamento</Label>
        <FormSelect
          id={`${departmentName}-ui`}
          name={persistDepartment ? departmentName : undefined}
          value={department}
          onValueChange={(v) => {
            setDepartment(v);
            setCity("");
          }}
          placeholder="Selecciona…"
          options={departments.map((d) => ({ value: d, label: d }))}
        />
      </div>
      <div className="field">
        <Label htmlFor={cityName}>{cityLabel}</Label>
        <FormSelect
          id={cityName}
          name={cityName}
          value={city}
          onValueChange={setCity}
          disabled={!department}
          placeholder={
            department ? "Selecciona…" : "Elige departamento primero"
          }
          options={cityOptions}
        />
      </div>
    </>
  );
}
