import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./index.css";
import App from "./App.tsx";

const theme = createTheme({
  typography: {
    fontFamily:
      '"Albert Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  palette: {
    primary: {
      main: "#667eea",
    },
    secondary: {
      main: "#764ba2",
    },
  },
  shape: {
    borderRadius: 8,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
