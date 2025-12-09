"use client";

import { useState, useEffect } from "react";
import Tag from "@/src/components/Tag.jsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase"; // ajuste o caminho conforme seu projeto

export default function Filters({
  filters,
  setFilters,
  sortOptions = [
    { value: "rating", label: "Rating" },
    { value: "review", label: "Reviews" },
  ],
}) {
  const [filterType, setFilterType] = useState("food");
  const [categoryList, setCategoryList] = useState([]);

  // 🔹 Estados carregados dinamicamente do Firestore
  const [stateOptions, setStateOptions] = useState([]);

  // 🔹 Carrega "state" diretamente dos documentos Firestore
  useEffect(() => {
    async function loadStates() {
      try {
        const snapshot = await getDocs(collection(db, "restaurants"));

        const states = new Set();

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.state) {
            states.add(data.state.trim());
          }
        });

        setStateOptions(["", ...Array.from(states).sort()]);
      } catch (err) {
        console.error("Erro carregando estados:", err);
      }
    }

    loadStates();
  }, []);

  // 🔹 Atualiza filtros
  const handleSelectionChange = (event, field) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const updateField = (type, value) => {
    setFilters({ ...filters, [type]: value });
  };

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

          {/* 🔸 Country (fixo ou pode remover se não usa mais) */}
          <div>
            <img src="/globe.svg" alt="Country" />
            <label>
              Country
              <select
                value={filters.country}
                onChange={(e) => handleSelectionChange(e, "country")}
              >
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="UK">UK</option>
              </select>
            </label>
          </div>

          {/* 🔸 STATE — AGORA CARREGADO DO FIREBASE */}
          <div>
            <img src="/globe.svg" alt="State" />
            <label>
              State
              <select
                value={filters.state}
                onChange={(e) => handleSelectionChange(e, "state")}
              >
                <option value="">All</option>
                {stateOptions.map((st, i) => (
                  <option key={i} value={st}>
                    {st || "All"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* 🔸 CITY (se quiser, posso tornar dinâmico também) */}
          <div>
            <img src="/location.svg" alt="City" />
            <label>
              City
              <select
                value={filters.city}
                onChange={(e) => handleSelectionChange(e, "city")}
              >
                <option value="">All</option>
                {/* Você pode futuramente carregar cidades dinamicamente */}
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
                    state: "",
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
