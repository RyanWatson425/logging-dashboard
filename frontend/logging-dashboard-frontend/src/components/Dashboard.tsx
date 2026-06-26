import LogDataGrid from "./LogDataGrid";
import useDebounce from "../hooks/useDebounce";
import { useState } from "react";

import styles from "./Dashboard.module.scss";

const Dashboard = () => {
  const { value: debouncedSearch, setValue: setDebouncedSearch } = useDebounce({
    initialValue: "",
    debounceMs: 300,
  });
  const [search, setSearch] = useState("");

  return (
    <>
      <div className={styles.gridHeader}>
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setDebouncedSearch(e.target.value);
            setSearch(e.target.value);
          }}
          className={styles.search}
        />
        <h2>System Logs Dashboard</h2>
        <div className={styles.placeholder} />
      </div>
      <LogDataGrid search={debouncedSearch} />
    </>
  );
};

export default Dashboard;
