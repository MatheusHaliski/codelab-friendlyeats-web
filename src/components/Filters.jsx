"use client";

import { useEffect } from "react";
import Tag from "@/src/components/Tag.jsx";

export default function Filters({
  filters,
  setFilters,
  categoryOptions = [""],
  cityOptions = [""],
  countryOptions = ["USA", "Canada", "UK"],
  stateOptions = [""],
  sortOptions = [
    { value: "rating", label: "Rating" },
    { value: "review", label: "Reviews" },
  ],
}) {
  // 🔹 Opções específicas para cada tipo
  const foodOptions = [
    "Pizza",
    "Burgers",
    "Coffee",
    "Japanese",
    "Italian",
    "Mexican",
    "Sushi",
    "Vegetarian",
    "Seafood",
    "Desserts",
  ];

  // Escolhe categoryList dinamicamente
  const categoryList =
    categoryOptions?.length ? categoryOptions : foodOptions;

  // ============================
  // HANDLERS
  // ============================

  const handleSelectionChange = (event, name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: event.target.value,
    }));
  };

  const handleCountryChange = (event) => {
    const value = event.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      country: value,
      state: "",
      city: "",
    }));
  };

  const handleStateChange = (event) => {
    const value = event.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      state: value,
      city: "",
    }));
  };

  const updateField = (type, value) => {
    setFilters({ ...filters, [type]: value });
  };

  // ============================
  // RENDER
  // ============================

  return (
    <section className="filter">
      <details className="filter-menu" open>
        <summary>
          <img src="/filter.svg" alt="filter" />
          <div>
            <p>Restaurants</p>
            <p>
              Sorted by{" "}
              {filters.sort === "review"
                ? "Number of Reviews"
                : "Average Rating"}
            </p>
          </div>
        </summary>

        <form
          method="GET"
          onSubmit={(e) => {
            e.preventDefault();
            e.target.parentNode.removeAttribute("open");
          }}
        >
          {/* CATEGORY */}
          <div>
            <img src="/food.svg" alt="Category" />
            <label>
              Category
              <select
                value={filters.category}
                onChange={(e) => handleSelectionChange(e, "category")}
              >
                {categoryList.map((option, i) => (
                  <option key={i} value={option}>
                    {option === "" ? "Selecione opção" : option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* COUNTRY */}
          <div>
            <img src="/add.svg" alt="Country" />
            <label>
              Country
              <select value={filters.country} onChange={handleCountryChange}>
                {countryOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c === "" ? "Selecione opção" : c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* STATE */}
          <div>
            <img src="/add.svg" alt="State" />
            <label>
              State
              <select
                value={filters.state}
                onChange={handleStateChange}
                disabled={!filters.country}
              >
                {stateOptions.map((state, i) => (
                  <option key={i} value={state}>
                    {state === "" ? "Selecione opção" : state}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* CITY */}
          <div>
            <img src="/location.svg" alt="City" />
            <label>
              City
              <select
                value={filters.city}
                onChange={(e) => handleSelectionChange(e, "city")}
                disabled={!filters.state}
              >
                {cityOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c === "" ? "Selecione opção" : c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* SORT */}
          <div>
            <img src="/sortBy.svg" alt="Sort" />
            <label>
              Sort
              <select
                value={filters.sort}
                onChange={(e) => handleSelectionChange(e, "sort")}
              >
                {sortOptions.map((s, i) => (
                  <option key={i} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <footer>
            <menu>
              <button
                className="button--cancel"
                type="reset"
                onClick={() =>
                  setFilters({
                    city: "",
                    category: "",
                    country: "",
                    state: "",
                    sort: "rating",
                  })
                }
              >
                Reset
              </button>
              <button type="submit" className="button--confirm">
                Submit
              </button>
            </menu>
          </footer>
        </form>
      </details>

      <div className="tags">
        {Object.entries(filters).map(([type, value]) => {
        if (type === "sort" || value === "") return null;
        return (
            <Tag
              key={type + value}
              type={type}
              value={value}
              updateField={updateField}
            />
          );
        })}
      </div>
    </section>
  );
}

