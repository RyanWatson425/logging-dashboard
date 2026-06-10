import { Columns3Cog } from "lucide-react";
import LogDataGrid from "./components/LogDataGrid";
import useDebounce from "./hooks/useDebounce";
import { useState } from "react";

const Dashboard = () => {
  const { value: debouncedSearch, setValue: setDebouncedSearch } = useDebounce({
    initialValue: "",
    debounceMs: 300,
  });
  const [search, setSearch] = useState("");

  return (
    <>
      <div className="grid-header">
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setDebouncedSearch(e.target.value);
            setSearch(e.target.value);
          }}
        />
        <Columns3Cog />
      </div>
      <LogDataGrid search={debouncedSearch} />
    </>
  );
};

export default Dashboard;
