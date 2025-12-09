"use client";

export default function Filters({
  categoryList = [],
  cityList = [],
  priceList = [],
  filters = {},
  onChange = () => {},
}) {
  function handleChange(e) {
    onChange({
      ...filters,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="filters-container p-4 bg-white shadow rounded-lg flex flex-col gap-4">
      
      {/* Categoria */}
      <div className="flex flex-col">
        <label className="font-semibold text-sm mb-1">Categoria</label>
        <select
          name="category"
          className="border rounded p-2"
          value={filters.category || ""}
          onChange={handleChange}
        >
          <option value="">Todas</option>
          {categoryList.map((option, i) => (
            <option key={i} value={option}>
              {option || "Todas"}
            </option>
          ))}
        </select>
      </div>

      {/* Cidade */}
      <div className="flex flex-col">
        <label className="font-semibold text-sm mb-1">Cidade</label>
        <select
          name="city"
          className="border rounded p-2"
          value={filters.city || ""}
          onChange={handleChange}
        >
          <option value="">Todas</option>
          {cityList.map((option, i) => (
            <option key={i} value={option}>
              {option || "Todas"}
            </option>
          ))}
        </select>
      </div>

      {/* Preço */}
      <div className="flex flex-col">
        <label className="font-semibold text-sm mb-1">Preço</label>
        <select
          name="price"
          className="border rounded p-2"
          value={filters.price || ""}
          onChange={handleChange}
        >
          <option value="">Todos</option>
          {priceList.map((option, i) => (
            <option key={i} value={option}>
              {option || "Todos"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
