"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { daneDepartments, daneMunicipalities } from "@/lib/dane";

export function LocationFields({
  departmentDefault,
  cityDefault,
  departmentName = "department",
  cityName = "city",
  cityLabel = "Municipio / ciudad",
}: {
  departmentDefault?: string | null;
  cityDefault?: string | null;
  departmentName?: string;
  cityName?: string;
  cityLabel?: string;
}) {
  const departments = useMemo(() => daneDepartments(), []);
  const [department, setDepartment] = useState(departmentDefault ?? "");
  const [city, setCity] = useState(cityDefault ?? "");
  const municipalities = daneMunicipalities(department);

  return (
    <>
      <div className="field">
        <Label htmlFor={departmentName}>Departamento</Label>
        <select
          id={departmentName}
          name={departmentName}
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setCity("");
          }}
        >
          <option value="">Selecciona…</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor={cityName}>{cityLabel}</Label>
        <select
          id={cityName}
          name={cityName}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!department}
        >
          <option value="">
            {department ? "Selecciona…" : "Elige departamento primero"}
          </option>
          {municipalities.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          {city && !municipalities.includes(city) ? (
            <option value={city}>{city} (actual)</option>
          ) : null}
        </select>
      </div>
    </>
  );
}
