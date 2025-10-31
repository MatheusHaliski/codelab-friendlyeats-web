"use client";

import Tag from "@/src/components/Tag.jsx";

function FilterSelect({ label, options, value, onChange, name, icon }) {
  return (
    <div>
      <img src={icon} alt={label} />
      <label>
        {label}
        <select value={value} onChange={onChange} name={name}>
          {options.map((option, index) => {
            const opt = typeof option === "string" ? option : option.value;
            return (
              <option key={index} value={opt}>
                {opt === "" ? "All" : opt}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}

export default function Filters({
  filters,
  setFilters,
  foodOptions = [""],
  otherOptions = [""],
  countryOptions = [""],
  cityOptions = [""],
  sortOptions = [
    { value: "rating", label: "Rating" },
    { value: "review", label: "Reviews" },
  ],
}) {
 {
  const handleSelectionChange = (event, name) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "country" ? { city: "" } : {}), // reseta cidade ao mudar país
    }));
  };

  const updateField = (type, value) => {
    setFilters({ ...filters, [type]: value });
  };

  return (
    <section className="filter">
      <details className="filter-menu">
        <summary>
          <img src="/filter.svg" alt="filter" />
          <div>
            <p>Search Restaurants & Lifestyle basics</p>
            <p>
              Sorted by{" "}
              {filters.sort === "review"
                ? "Number of Reviews"
                : "Average Rating"}
            </p>
          </div>
        </summary>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.target.parentNode.removeAttribute("open");
          }}
        >
// Novo filtro de tipo principal
<FilterSelect
  label="Type"
  options={["", "Food", "Lifestyle"]}
  value={filters.mainType}
  onChange={(e) => {
    const selected = e.target.value;
    setFilters({
      ...filters,
      mainType: selected,
      category: "", // limpa a categoria anterior
    });
  }}
  name="mainType"
  icon="/type.svg" // ícone genérico (veja abaixo)
  key="type-filter"
/>

// Subfiltro dinâmico (aparece conforme a escolha do tipo)
{filters.mainType === "Food" && (
  <FilterSelect
    label="Food Category"
    options={foodOptions}
    value={filters.category}
    onChange={(e) => handleSelectionChange(e, "category")}
    name="category"
    icon="/food.svg"
    key="food-filter"
  />
)}

{filters.mainType === "Lifestyle" && (
  <FilterSelect
    label="Lifestyle Category"
    options={otherOptions}
    value={filters.category}
    onChange={(e) => handleSelectionChange(e, "category")}
    name="category"
    icon="/lifestyle.svg"
    key="lifestyle-filter"
  />
)}



          <FilterSelect
            label="Country"
            options={countryOptions}
            value={filters.country}
            onChange={(e) => handleSelectionChange(e, "country")}
            name="country"
            icon="/globe.png"
          />

          <FilterSelect
            label="City"
            options={cityOptions}
            value={filters.city}
            onChange={(e) => handleSelectionChange(e, "city")}
            name="city"
            icon="/location.svg"
          />

          <FilterSelect
            label="Sort"
            options={sortOptions}
            value={filters.sort}
            onChange={(e) => handleSelectionChange(e, "sort")}
            name="sort"
            icon="/sortBy.svg"
          />

          <footer>
            <menu>
              <button
                className="button--cancel"
                type="reset"
                onClick={() =>
                  setFilters({
                    category: "",
                    country: "",
                    city: "",
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
