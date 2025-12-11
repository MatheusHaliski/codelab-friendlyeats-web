"use client";

import Tag from "@/src/components/Tag.jsx";
import { CATEGORY_OPTIONS } from "@/src/lib/categoryOptions.js";

export default function Filters({
  filters,
  setFilters,
  categoryOptions = CATEGORY_OPTIONS,
  cityOptions = [""],
  stateOptions = [""],
  countryOptions = [""],
  sortOptions = [
    { value: "rating", label: "Rating" },
    { value: "review", label: "Reviews" },
  ],
}) {
  const typeOptions = [
    { value: "food", label: "Food" },
    { value: "lifestyle", label: "Lifestyle" },
  ];

  const finalCategoryList = [
    "",
    ...(categoryOptions[filters.type || "food"] ?? []),
  ];

  const handleSelection = (e, field) => {
    setFilters((prev) => ({
      ...prev,
      [field]: e.target.value,
      ...(field === "type" ? { category: "" } : {}),
    }));
  };

  const handleNameChange = (e) =>
    setFilters((prev) => ({
      ...prev,
      name: e.target.value,
    }));

  const handleCountry = (e) =>
    setFilters((prev) => ({
      ...prev,
      country: e.target.value,
      state: "",
      city: "",
    }));

  const handleState = (e) =>
    setFilters((prev) => ({
      ...prev,
      state: e.target.value,
      city: "",
    }));

  const updateField = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  return (
    <section className="filter">
      <details className="filter-menu" open>
        <summary>
          <img src="/filter.svg" alt="filter" />
          <div>
            <p>Restaurants</p>
            <p>
              Sorted by{" "}
              {filters.sort === "review" ? "Number of Reviews" : "Average Rating"}
            </p>
          </div>
        </summary>

        {/* FORM */}
        <form method="GET">

          {/* NAME */}
          <div>
            <label>
              Name
              <input
                type="text"
                style={{ height: "75px" }}
                value={filters.name}
                onChange={handleNameChange}
                placeholder="Search by name"
              />
            </label>
          </div>

          {/* TYPE */}
          <div>
            <label>
              Type
              <select
                value={filters.type}
                onChange={(e) => handleSelection(e, "type")}
              >
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* CATEGORY */}
          <div>
            <label>
              Category
              <select
                value={filters.category}
                onChange={(e) => handleSelection(e, "category")}
              >
                {finalCategoryList.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat === "" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* COUNTRY */}
          <div>
            <label>
              Country
              <select value={filters.country} onChange={handleCountry}>
                {countryOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* STATE */}
          <div>
            <label>
              State
              <select
                value={filters.state}
                onChange={handleState}
                disabled={!filters.country}
              >
                {stateOptions.map((s, i) => (
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* CITY */}
          <div>
            <label>
              City
              <select
                value={filters.city}
                onChange={(e) => handleSelection(e, "city")}
                disabled={!filters.state}
              >
                {cityOptions.map((city, i) => (
                  <option key={i} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* SORT */}
          <div>
            <label>
              Sort
              <select
                value={filters.sort}
                onChange={(e) => handleSelection(e, "sort")}
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

        </form>
      </details>

      {/* TAGS */}
      <div className="tags">
        {Object.entries(filters).map(([key, value]) => {
          if (!value || key === "sort") return null;
          return (
            <Tag key={key} type={key} value={value} updateField={updateField} />
          );
        })}
      </div>
    </section>
  );
}
