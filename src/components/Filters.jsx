"use client";

import { useMemo } from "react";
import Tag from "@/src/components/Tag.jsx";

// ----------------------------------------
// 🔥 LISTAS
// ----------------------------------------

const lifestyleKeywords = [
  "life","education","entertainment","parks","appliances","arcade","crafts",
  "galleries","auto","battery","business","cinema","clothing","electronics",
  "motor","vehicles","school","herbal","comedy","clubs","gifts","flowers",
  "equipment","gas","music","museum","laser","tag","golf","lessons","outdoor",
  "gear","karts","beaches","accessories","car","dealers","tours","boating",
  "boat","casinos","classes","cosmetics","furniture","fireworks","fishing",
  "florists","churches","christmas trees","crane","children","spas","heating",
  "air","conditioning","art","yoga","dvd","cleaning","gun","rifle","ammo",
  "hair","funeral","musicians","motorcycles","bath","hotels","health",
  "events","nail","wear","massage","doctors","repair","pool","pub","race",
  "tracks","fashion","transportation","financial","educational","books",
  "hvac","it","computer","hardware","mental","counseling","removal",
  "indoor","playcenter","care","country","installation","waxing",
  "drugstores","banks"
];

const foodKeywords = [
  "food","bowls","trucks","restaurants","cheesecakes","american","italian",
  "greek","german","austrian","spanish","argentinian","mexican","brazilian",
  "french","english","portuguese","african","japanese","chinese","korean",
  "chicken","barbecue","cakes","cupcakes","coffeshops","coffee","chocolatiers",
  "afghan","armenian","grocery","hawaiian","creperies","bars","beer",
  "colombian","fruits","veggies","fast food","kebab","gelato","ice cream",
  "tea","pizza","asian","middle eastern","cuban","hot dogs","sandwiches",
  "nightlife","moroccan","mongolian","lounges","latin american","fish",
  "chips","british","donuts","fondue","wine","russian","olive","syrian",
  "meat","market","lebanese","dim sum","crawl","cajun","creole","gluten",
  "brew","breakfast","brunch","buffets","flavor","falafel","farmers",
  "dominican","mediterran","waffles","noodles","filipino","beverage",
  "egyptian","breweries","desserts","department","blues","jazz","butcher",
  "brasseries","bistros","yogurt","garden","bagels","irish","iberian",
  "laotian","juice","pot","herbs","spices","oriental","wraps","cooking",
  "delis","dinners","czech","himalayan","nepalese","fusion","caterers"
];

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

  const typeOptions = [
    { value: "food", label: "Food" },
    { value: "lifestyle", label: "Lifestyle" },
  ];

  // ----------------------------------------
  // Função uppercase
  // ----------------------------------------
  function capitalize(str) {
    return str
      .split(" ")
      .map(word =>
        word.length > 0
          ? word[0].toUpperCase() + word.slice(1).toLowerCase()
          : word
      )
      .join(" ");
  }

  // ----------------------------------------
  // CLASSIFICAÇÃO
  // ----------------------------------------
  function classifyCategory(cat) {
    if (!cat) return "food";
    const key = cat.toLowerCase();

    if (foodKeywords.some(k => key.includes(k))) return "food";
    if (lifestyleKeywords.some(k => key.includes(k))) return "lifestyle";

    return "food";
  }

  // ----------------------------------------
  // FILTRAGEM DO SELECT PELO TYPE
  // ----------------------------------------
  const filteredCategoryList = useMemo(() => {
    if (!categoryOptions?.length) return [];

    return categoryOptions.filter((cat) => {
      const detectedType = classifyCategory(cat);
      return detectedType === (filters.type || "food");
    });
  }, [categoryOptions, filters.type]);

  // ----------------------------------------
  // FINAL CATEGORY LIST – AGORA COM OPÇÃO EM BRANCO PARA LIFESTYLE
  // ----------------------------------------
const finalCategoryList =
  filteredCategoryList.length
    ? ["", ...filteredCategoryList] // adiciona All Categories no topo
    : filters.type === "lifestyle"
      ? ["", ...lifestyleKeywords.map(capitalize)]   // sempre começa com All Categories
      : ["", ...foodKeywords.map(capitalize)];

  // ----------------------------------------
  // HANDLERS
  // ----------------------------------------
  const handleSelectionChange = (event, name) => {
    setFilters((prev) => ({
      ...prev,
      [name]: event.target.value,
      ...(name === "type" ? { category: "" } : {}),
    }));
  };
 const handleNameChange = (event) => {
    const name = event.target.value;
    setFilters((prev) => ({
      ...prev,
      name,
    }));
  };
  const handleCountryChange = (e) =>
    setFilters((prev) => ({
      ...prev,
      country: e.target.value,
      state: "",
      city: "",
    }));

  const handleStateChange = (e) =>
    setFilters((prev) => ({
      ...prev,
      state: e.target.value,
      city: "",
    }));

  const updateField = (type, value) =>
    setFilters({ ...filters, [type]: value });

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <section className="filter">
      <details className="filter-menu" open>
        <summary>
          <img src="/filter.svg" alt="filter" />
          <div>
            <p>Restaurants</p>
            <p>
              Sorted by
              {filters.sort === "review" ? "Number of Reviews" : "Average Rating"}
            </p>
          </div>
        </summary>

        <form method="GET">
{/* NAME */}
          <div>
            <label>
              Name
              <input
                type="text"
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
                onChange={(e) => handleSelectionChange(e, "type")}
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
                onChange={(e) => handleSelectionChange(e, "category")}
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
              <select value={filters.country} onChange={handleCountryChange}>
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
                onChange={handleStateChange}
                disabled={!filters.country}
              >
                {stateOptions.map((st, i) => (
                  <option key={i} value={st}>
                    {st}
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
                onChange={(e) => handleSelectionChange(e, "city")}
                disabled={!filters.state}
              >
                {cityOptions.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
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
                onChange={(e) => handleSelectionChange(e, "sort")}
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
        {Object.entries(filters).map(([type, value]) => {
          if (!value || type === "sort") return null;
          return <Tag key={type} type={type} value={value} updateField={updateField} />;
        })}
      </div>
    </section>
  );
}
