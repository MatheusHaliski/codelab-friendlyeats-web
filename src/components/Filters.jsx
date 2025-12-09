"use client";

import { useState, useEffect } from "react";
import Tag from "@/src/components/Tag.jsx";

export default function Filters({
  filters,
  setFilters,
  categoryOptions = [""],
  cityOptions = [""],
  countryOptions = ["USA", "Canada", "UK"],
  sortOptions = [
    { value: "rating", label: "Rating" },
    { value: "review", label: "Reviews" },
  ],
}) {
  // 🔹 Controle do tipo principal
  const [filterType, setFilterType] = useState("food");
  const [categoryList, setCategoryList] = useState([]);

  // 🔹 Opções específicas para cada tipo
  const foodOptions = [
    "", "Pizza", "Burgers", "Coffee", "Japanese", "Italian", "Mexican", "Sushi",
    "Vegetarian", "Seafood", "Desserts"
  ];

  const lifestyleOptions = [
    "", "Technology", "Hotel", "Education", "Travel", "Spa", "Car", "Pet", "Health"
  ];

  useEffect(() => {
    setCategoryList(filterType === "food" ? foodOptions : lifestyleOptions);
  }, [filterType]);

  const handleSelectionChange = (event, name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: event.target.value,
    }));
  };

  const handleMainTypeChange = (e) => {
    setFilterType(e.target.value);
    // 🔸 Limpa o filtro de categoria ao mudar o tipo
    setFilters((prev) => ({ ...prev, category: "" }));
  };

  const updateField = (type, value) => {
    setFilters({ ...filters, [type]: value });
  };

  return (
    <section className="filter">
      <details className="filter-menu" open>
        <summary>
          <img src="/friendly-eats.svg" alt="filter" />
          <div>
            <p>Restaurants</p>
            <p>
              Sorted by{" "}
              {filters.sort === "review" ? "Number of Reviews" : "Average Rating"}
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
          {/* 🔸 Novo filtro principal */}
          <div>
            <img src="/add.svg" alt="Main Type" />
            <label>
              Type
              <select value={filterType} onChange={handleMainTypeChange}>
                <option value="food">Food</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </label>
          </div>

          {/* 🔸 Filtro secundário (depende do tipo) */}
          <div>
            <img src={filterType === "food" ? "/food.svg" : "/lifestyle.svg"} alt="Category" />
            <label>
              Category
              <select
                value={filters.category}
                onChange={(e) => handleSelectionChange(e, "category")}
              >
                {categoryList.map((option, i) => (
                  <option key={i} value={option}>
                    {option === "" ? option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 Country */}
          <div>
            <img src="/globe.svg" alt="Country" />
            <label>
              Country
              <select
                value={filters.country}
                onChange={(e) => handleSelectionChange(e, "country")}
              >
                {countryOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c === "" ? c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 City */}
          <div>
            <img src="/location.svg" alt="City" />
            <label>
              City
              <select
                value={filters.city}
                onChange={(e) => handleSelectionChange(e, "city")}
              >
                {cityOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c === "" ?  c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 Sort */}
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
