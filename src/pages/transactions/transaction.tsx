import { useNavigate } from "react-router-dom";

const Transaction = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => navigate("/userProfile")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
          aria-label="Go to profile"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
        <h1>Transaction Page</h1>
      </div>
      <p>This is where transaction details will be displayed.</p>
    </div>
  );
};

export default Transaction;