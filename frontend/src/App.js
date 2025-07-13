import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:8000/upload-pdf", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Clinical Trial Matcher</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 8 }}>
        Upload PDF
      </button>
      {result && (
        <div style={{ marginTop: 32 }}>
          <h2>Results</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          {/* TODO: Render dashboard and trial list with eligibility ticks */}
        </div>
      )}
    </div>
  );
}

export default App;
