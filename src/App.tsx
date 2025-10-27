import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Tests from "./pages/Tests";
import Executions from "./pages/Executions";
import Details from "./pages/Details";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tests/:projectId" element={<Tests />} />
        <Route path="/executions/:projectId" element={<Executions/>} />
        <Route path="/details/:projectId/:testId" element={<Details/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
