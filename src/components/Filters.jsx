// The filters shown on the restaurant listings page

import Tag from "@/src/components/Tag.jsx";

function FilterSelect({ label, options, value, onChange, name, icon }) {
  return (
    <div>
      <img src={icon} alt={label} />
      <label>
        {label}
        <select value={value} onChange={onChange} name={name}>
          {options.map((option, index) => {
            const optionValue =
              typeof option === "string" ? option : option.value ?? "";
            const optionLabel =
              typeof option === "string" ? option : option.label ?? option.value;
            const key = optionValue === "" ? `all-${index}` : optionValue;
            return (
              <option value={optionValue} key={key}>
                {optionValue === "" ? "All" : optionLabel}
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
  categoryOptions = [""],
  cityOptions = [""],
  priceOptions = ["", "$", "$$", "$$$", "$$$$"],
  sortOptions = [
    { value: "rating", label: "Rating" },
    { value: "review", label: "Review" },
  ],
}) {
  const ensureAllOption = (options) => {
    if (!Array.isArray(options) || options.length === 0) {
      return [""];
    }
    const normalized = options.filter(
      (option) => option !== undefined && option !== null
    );
    if (normalized.length === 0) return [""];
    return normalized[0] === "" ? normalized : ["", ...normalized];
  };

  const categories = ensureAllOption(categoryOptions);
  const cities = ensureAllOption(cityOptions);
  const prices = ensureAllOption(priceOptions);

  const handleSelectionChange = (event, name) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: event.target.value,
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
          onSubmit={(event) => {
            event.preventDefault();
            event.target.parentNode.removeAttribute("open");
          }}
        >
          <FilterSelect
            label="Category"
            options={categories}
            value={filters.category}
            onChange={(event) => handleSelectionChange(event, "category")}
            name="category"
            icon="/food.svg"
          />

          <FilterSelect
            label="City"
            options={cities}
            value={filters.city}
            onChange={(event) => handleSelectionChange(event, "city")}
            name="city"
            icon="/location.svg"
          />

          <FilterSelect
            label="Price"
            options={prices}
            value={filters.price}
            onChange={(event) => handleSelectionChange(event, "price")}
            name="price"
            icon="/price.svg"
          />

          <FilterSelect
            label="Sort"
            options={sortOptions}
            value={filters.sort}
            onChange={(event) => handleSelectionChange(event, "sort")}
            name="sort"
            icon="/sortBy.svg"
          />

          <footer>
            <menu>
              <button
                className="button--cancel"
                type="reset"
                onClick={() => {
                  setFilters({
                    city: "",
                    category: "",
                    price: "",
                    sort: "rating",
                  });
                }}
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
