"use client";

import { useMemo } from "react";
import Tag from "@/src/components/Tag.jsx";

// ----------------------------------------------
// LISTAS KEYWORDS
// ----------------------------------------------

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

// ----------------------------------------------

export default function Filters({
  filters,
  setFilters,
  categoryOptions = [""],
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

  function capitalize(str) {
    return str
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
  }

  function classifyCategory(cat) {
    if (!cat) return "food";
    const key = cat.toLowerCase();
    if (foodKeywords.some((k) => key.includes(k))) return "food";
    if (lifestyleKeywords.some((k) => key.includes(k))) return "lifestyle";
    return "food";
  }

  // Filtrando lista por type detectado
  const filteredCategoryList = useMemo(() => {
    if (!categoryOptions?.length) return [];
    return categoryOptions.filter(
      (c) => classifyCategory(c) === (filters.type || "food")
    );
  }, [categoryOptions, filters.type]);

  const finalCategoryList =
    filteredCategoryList.length
      ? ["", ...filteredCategoryList]
      : filters.type === "lifestyle"
      ? ["", ...lifestyleKeywords.map(capitalize)]
      : ["", ...foodKeywords.map(capitalize)];

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
