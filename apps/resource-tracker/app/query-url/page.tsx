"use client";

import {
  useQueryState,
  useQueryStates,
  parseAsInteger,
  parseAsFloat,
  parseAsBoolean,
  parseAsJson,
  parseAsStringLiteral,
} from "nuqs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function QueryTestContent() {
  // Basic string query
  const [name, setName] = useQueryState("name", { defaultValue: "" });

  // Number queries
  const [count, setCount] = useQueryState(
    "count",
    parseAsInteger.withDefault(0)
  );
  const [price, setPrice] = useQueryState(
    "price",
    parseAsFloat.withDefault(0.0)
  );

  // Boolean query
  const [isActive, setIsActive] = useQueryState(
    "active",
    parseAsBoolean.withDefault(false)
  );

  // Select with string literals
  const sortOptions = ["asc", "desc"] as const;
  const [sortOrder, setSortOrder] = useQueryState(
    "sort",
    parseAsStringLiteral(sortOptions).withDefault("asc")
  );

  // Multiple coordinates using useQueryStates
  const [coords, setCoords] = useQueryStates({
    lat: parseAsFloat.withDefault(0),
    lng: parseAsFloat.withDefault(0),
  });

  // Complex object using JSON
  const [filters, setFilters] = useQueryState(
    "filters",
    parseAsJson(
      (value: unknown) =>
        value as { category?: string; minPrice?: number } | null
    )
  );

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">NuQS Query Parameters Test</h1>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Name (String)
          </label>
          <input
            type="text"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-sm p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Counter (Integer)
          </label>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCount((c) => c - 1)}>-</Button>
            <span className="mx-2">{count}</span>
            <Button onClick={() => setCount((c) => c + 1)}>+</Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Price (Float)
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.valueAsNumber)}
            className="border rounded-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Active (Boolean)
          </label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mr-2"
          />
          <span>Status: {isActive ? "Active" : "Inactive"}</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Sort Order (String Literal)
          </label>
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as (typeof sortOptions)[number])
            }
            className="border rounded-sm p-2"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Coordinates (Multiple States)
          </label>
          <div className="flex gap-4">
            <input
              type="number"
              step="0.000001"
              value={coords.lat}
              onChange={(e) => setCoords({ lat: e.target.valueAsNumber })}
              placeholder="Latitude"
              className="border rounded-sm p-2"
            />
            <input
              type="number"
              step="0.000001"
              value={coords.lng}
              onChange={(e) => setCoords({ lng: e.target.valueAsNumber })}
              placeholder="Longitude"
              className="border rounded-sm p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Filters (JSON)
          </label>
          <Button
            onClick={() =>
              setFilters({
                category: "electronics",
                minPrice: 100,
              })
            }
          >
            Set Sample Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilters(null)}
            className="ml-2"
          >
            Clear Filters
          </Button>
          <pre className="mt-2 p-2 bg-gray-100 rounded-sm">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
}

export default function QueryTestPage() {
  return (
    <Suspense>
      <QueryTestContent />
    </Suspense>
  );
}
