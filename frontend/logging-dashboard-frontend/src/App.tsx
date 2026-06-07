import "./App.css";
import LogDataGrid from "./components/LogDataGrid";
import { Columns3Cog } from "lucide-react";

const App = () => {
  return (
    <div className="app-wrapper">
      <h1>title</h1>
      <div className="grid-header">
        <input placeholder="Search" />
        <Columns3Cog />
      </div>
      <LogDataGrid />
    </div>
  );
};

export default App;
