"use client";

import { useState, useEffect } from "react";
import Tag from "@/src/components/Tag.jsx";

export default function Filters({
  filters,
  setFilters,
  categoryOptions = [""],
  cityOptions = [""], // <- será ignorado agora
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
    "Select Food Option", "Pizza", "Burgers", "Coffee", "Japanese", "Italian", "Mexican", "Sushi",
    "Vegetarian", "Seafood", "Desserts"
  ];

  const lifestyleOptions = [
    "Select lifestyle Option", "Technology", "Hotel", "Education", "Travel", "Spa", "Car", "Pet", "Health"
  ];

  // 🔹 CIDADES POR PAÍS
  const citiesByCountry = {
    USA: [
      "Select", "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
      "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    ],
    Canada: [
      "Select", "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa",
      "Edmonton", "Winnipeg", "Quebec City", "Hamilton",
    ],
    UK: [
      "Select", "London", "Manchester", "Birmingham", "Liverpool", "Leeds",
      "Glasgow", "Bristol", "Sheffield", "Edinburgh",
    ]
  };

  // 🔹 Atualiza a lista de categorias conforme o tipo
  useEffect(() => {
    setCategoryList(filterType === "food" ? foodOptions : lifestyleOptions);
  }, [filterType]);

  // 🔹 Atualiza filtros
  const handleSelectionChange = (event, name) => {
    const value = event.target.value;

    // 🔸 Se o usuário mudar o país → resetar cidade
    if (name === "country") {
      setFilters((prev) => ({
        ...prev,
        country: value,
        city: "", // sempre limpa a cidade
      }));
      return;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // 🔹 Mudança do tipo principal
  const handleMainTypeChange = (e) => {
    setFilterType(e.target.value);
    setFilters((prev) => ({ ...prev, category: "" }));
  };

  const updateField = (type, value) => {
    setFilters({ ...filters, [type]: value });
  };

  // 🔹 Cidades exibidas dependem do país selecionado
  const cityList = citiesByCountry[filters.country] ?? [""];

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

        <form
          method="GET"
          onSubmit={(e) => {
            e.preventDefault();
            e.target.parentNode.removeAttribute("open");
          }}
        >
          {/* 🔸 Tipo principal */}
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

          {/* 🔸 Categoria */}
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
                    {option === "" ? "All" : option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 País */}
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
                    {c === "" ? "All" : c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 Cidade → muda conforme o país */}
          <div>
            <img src="/location.svg" alt="City" />
            <label>
              City
              <select
                value={filters.city}
                onChange={(e) => handleSelectionChange(e, "city")}
              >
                {cityList.map((city, i) => (
                  <option key={i} value={city}>
                    {city === "" ? "All" : city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 Ordenação */}
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

      {/* TAGS DINÂMICAS */}
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
