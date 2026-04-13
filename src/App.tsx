import { ChangeEvent, useEffect, useMemo, useState } from "react";

type EntryMode = "value" | "notes";

type Cell = {
  value: number | null;
  notes: number[];
  highlight: string | null;
  textColor: string;
};

type Grid = Cell[][];

type ExportedData = {
  version: number;
  grid: Grid;
  imageDataUrl: string | null;
};

const GREEK = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι"];
const LATIN = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const DEFAULT_TEXT_COLOR = "#1f2b38";
const COLORS = [
  { name: "Gold", value: "#ffd166" },
  { name: "Coral", value: "#f4978e" },
  { name: "Mint", value: "#8ecae6" },
  { name: "Sage", value: "#b7e4c7" },
  { name: "Peach", value: "#fec89a" },
  { name: "Lavender", value: "#cdb4db" }
];
const TEXT_COLORS = [
  { name: "Black", value: "#1f2b38" },
  { name: "Blue", value: "#2952cc" },
  { name: "Green", value: "#166534" },
  { name: "Red", value: "#b42318" },
  { name: "Purple", value: "#6d28d9" },
  { name: "Brown", value: "#7c3f00" }
];

function createEmptyCell(): Cell {
  return { value: null, notes: [], highlight: null, textColor: DEFAULT_TEXT_COLOR };
}

function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, createEmptyCell));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })));
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function parseCellKey(key: string): { row: number; col: number } {
  const [row, col] = key.split("-").map(Number);
  return { row, col };
}

function getDigitFromKeyboardEvent(event: KeyboardEvent): number | null {
  if (/^[1-9]$/.test(event.key)) {
    return Number(event.key);
  }

  const digitMatch = event.code.match(/^Digit([1-9])$/);
  if (digitMatch) {
    return Number(digitMatch[1]);
  }

  const numpadMatch = event.code.match(/^Numpad([1-9])$/);
  if (numpadMatch) {
    return Number(numpadMatch[1]);
  }

  return null;
}

function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function App() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const [mode, setMode] = useState<EntryMode>("value");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const selectedCell = useMemo(() => {
    if (!activeCellKey) return null;
    const { row, col } = parseCellKey(activeCellKey);
    return grid[row][col];
  }, [activeCellKey, grid]);

  const applyToSelected = (updater: (cell: Cell) => Cell) => {
    if (selectedCells.size === 0) return;

    setGrid((current) => {
      const next = cloneGrid(current);

      selectedCells.forEach((key) => {
        const { row, col } = parseCellKey(key);
        next[row][col] = updater(next[row][col]);
      });

      return next;
    });
  };

  const handleDigitInput = (digit: number) => {
    applyToSelected((cell) => {
      if (mode === "value") {
        return {
          ...cell,
          value: digit,
          notes: []
        };
      }

      if (cell.value !== null) {
        return {
          ...cell,
          value: null,
          notes: [digit]
        };
      }

      const notes = cell.notes.includes(digit)
        ? cell.notes.filter((n) => n !== digit)
        : [...cell.notes, digit].sort((a, b) => a - b);

      return {
        ...cell,
        notes
      };
    });
  };

  const clearSelectedCell = () => {
    applyToSelected((cell) => ({ ...cell, value: null, notes: [] }));
  };

  const clearHighlights = () => {
    setGrid((current) =>
      current.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes], highlight: null })))
    );
  };

  const setHighlight = (color: string | null) => {
    applyToSelected((cell) => ({ ...cell, highlight: color }));
  };

  const setTextColor = (color: string) => {
    applyToSelected((cell) => ({ ...cell, textColor: color }));
  };

  const resetAll = () => {
    setGrid(createEmptyGrid());
    setSelectedCells(new Set());
    setActiveCellKey(null);
  };

  const handleCellClick = (row: number, col: number, additiveSelection: boolean) => {
    const key = cellKey(row, col);

    if (additiveSelection) {
      setSelectedCells((current) => {
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
      setActiveCellKey(key);
      return;
    }

    setSelectedCells(new Set([key]));
    setActiveCellKey(key);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadGrid = (withLegends: boolean) => {
    const cellSize = 56;
    const colLegendHeight = withLegends ? 52 : 0;
    const rowLegendWidth = withLegends ? 52 : 0;
    const gridSize = cellSize * 9;
    const outerMargin = 16;
    const offsetX = outerMargin;
    const offsetY = outerMargin;

    const canvas = document.createElement("canvas");
    canvas.width = rowLegendWidth + gridSize + outerMargin * 2;
    canvas.height = colLegendHeight + gridSize + outerMargin * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background for scientific paper integration.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (withLegends) {
      // Column labels (Greek).
      ctx.fillStyle = "#1f2b38";
      ctx.font = "700 28px Manrope, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      GREEK.forEach((label, col) => {
        const x = offsetX + rowLegendWidth + col * cellSize + cellSize / 2;
        const y = offsetY + colLegendHeight / 2;
        ctx.fillText(label, x, y);
      });

      // Row labels (Latin).
      ctx.font = "700 28px Manrope, Segoe UI, sans-serif";
      LATIN.forEach((label, row) => {
        const x = offsetX + rowLegendWidth / 2;
        const y = offsetY + colLegendHeight + row * cellSize + cellSize / 2;
        ctx.fillText(label, x, y);
      });
    }

    // Cell backgrounds (highlights).
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const cell = grid[row][col];
        const x = offsetX + rowLegendWidth + col * cellSize;
        const y = offsetY + colLegendHeight + row * cellSize;

        ctx.fillStyle = cell.highlight ?? "#ffffff";
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Grid lines.
    for (let i = 0; i <= 9; i += 1) {
      const x = offsetX + rowLegendWidth + i * cellSize;
      const y = offsetY + colLegendHeight + i * cellSize;

      ctx.strokeStyle = "#6d7989";
      ctx.lineWidth = i % 3 === 0 ? 2 : 1;

      ctx.beginPath();
      ctx.moveTo(x, offsetY + colLegendHeight);
      ctx.lineTo(x, offsetY + colLegendHeight + gridSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offsetX + rowLegendWidth, y);
      ctx.lineTo(offsetX + rowLegendWidth + gridSize, y);
      ctx.stroke();
    }

    // Values and notes.
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const cell = grid[row][col];
        const x = offsetX + rowLegendWidth + col * cellSize;
        const y = offsetY + colLegendHeight + row * cellSize;

        if (cell.value) {
          ctx.fillStyle = cell.textColor || DEFAULT_TEXT_COLOR;
          ctx.font = "600 52px Yrsa, Georgia, serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(cell.value), x + cellSize / 2, y + cellSize / 2);
        } else if (cell.notes.length > 0) {
          ctx.fillStyle = cell.textColor || DEFAULT_TEXT_COLOR;
          ctx.font = "500 13px Yrsa, Georgia, serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          DIGITS.forEach((digit, index) => {
            if (!cell.notes.includes(digit)) return;

            const noteCol = index % 3;
            const noteRow = Math.floor(index / 3);
            const noteX = x + (noteCol + 0.5) * (cellSize / 3);
            const noteY = y + (noteRow + 0.5) * (cellSize / 3);
            ctx.fillText(String(digit), noteX, noteY);
          });
        }
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        triggerDownload(
          canvas.toDataURL("image/png"),
          withLegends ? "sudoku-grid-with-legends.png" : "sudoku-grid-no-legends.png"
        );
        return;
      }

      const url = URL.createObjectURL(blob);
      triggerDownload(url, withLegends ? "sudoku-grid-with-legends.png" : "sudoku-grid-no-legends.png");
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
  };

  const exportGrid = () => {
    const data: ExportedData = {
      version: 1,
      grid,
      imageDataUrl
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sudoku-state.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importGrid = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== "string") {
          return;
        }

        const parsed = JSON.parse(reader.result) as ExportedData;
        if (!parsed.grid || parsed.grid.length !== 9) {
          return;
        }

        const normalized = parsed.grid.map((row) =>
          row.map((cell) => ({
            value: cell.value && cell.value >= 1 && cell.value <= 9 ? cell.value : null,
            notes: Array.isArray(cell.notes)
              ? cell.notes.filter((n) => n >= 1 && n <= 9).sort((a, b) => a - b)
              : [],
            highlight: cell.highlight ?? null,
            textColor: typeof cell.textColor === "string" ? cell.textColor : DEFAULT_TEXT_COLOR
          }))
        );

        setGrid(normalized);
        setImageDataUrl(parsed.imageDataUrl ?? null);
        setSelectedCells(new Set());
        setActiveCellKey(null);
      } catch {
        // Ignore malformed imports to keep UX simple.
      }
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (selectedCells.size === 0) return;

      const target = event.target as HTMLElement | null;
      if (target && (target.closest("input, textarea, select") || target.isContentEditable)) {
        return;
      }

      const digit = getDigitFromKeyboardEvent(event);
      if (digit !== null) {
        event.preventDefault();
        handleDigitInput(digit);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        clearSelectedCell();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCells, mode]);

  return (
    <div className="app-shell">
      <main className="editor-card">
        <section className="top-bar">
          <h1>Sudoku Editor</h1>
          <p>Upload, annotate, and organize your grid freely.</p>
        </section>

        <section className="workspace-layout">
          <section className="board-wrap">
            <div className="board-layout">
            <div className="col-headers" aria-hidden="true">
              <div className="axis-spacer" />
              {GREEK.map((letter) => (
                <div key={`col-header-${letter}`} className="axis-header top">
                  <span>{letter}</span>
                </div>
              ))}
            </div>

            <div className="board-main">
              <div className="row-headers" aria-hidden="true">
                {LATIN.map((letter) => (
                  <div key={`row-header-${letter}`} className="axis-header left">
                    <span>{letter}</span>
                  </div>
                ))}
              </div>

                <div className="sudoku-grid-frame" role="grid" aria-label="Editable Sudoku grid">
                  {grid.flatMap((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const isSelected = selectedCells.has(cellKey(rowIndex, colIndex));
                      const classes = [
                        "sudoku-cell",
                        isSelected ? "selected" : "",
                        rowIndex % 3 === 2 && rowIndex !== 8 ? "thick-bottom" : "",
                        colIndex % 3 === 2 && colIndex !== 8 ? "thick-right" : ""
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          type="button"
                          className={classes}
                          style={{
                            backgroundColor: cell.highlight ?? undefined,
                            color: cell.textColor || DEFAULT_TEXT_COLOR
                          }}
                          onClick={(event) =>
                            handleCellClick(rowIndex, colIndex, event.ctrlKey || event.metaKey)
                          }
                        >
                          {cell.value ? (
                            <span className="cell-value">{cell.value}</span>
                          ) : (
                            <div className="notes-grid">
                              {DIGITS.map((digit) => (
                                <span key={digit}>{cell.notes.includes(digit) ? digit : ""}</span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="controls-column">
            <div className="panel">
              <h2>Image</h2>
              <div className="actions">
                <button type="button" onClick={() => downloadGrid(true)}>
                  Download grid (with legends)
                </button>
                <button type="button" onClick={() => downloadGrid(false)}>
                  Download grid (no legends)
                </button>
              </div>
              {imageDataUrl && <img className="sudoku-image" src={imageDataUrl} alt="Loaded Sudoku" />}
            </div>

            <div className="panel">
              <h2>Input mode</h2>
              <div className="mode-switch">
                <button
                  className={mode === "value" ? "active" : ""}
                  onClick={() => setMode("value")}
                  type="button"
                >
                  Numbers
                </button>
                <button
                  className={mode === "notes" ? "active" : ""}
                  onClick={() => setMode("notes")}
                  type="button"
                >
                  Notes
                </button>
              </div>

              <div className="digit-pad">
                {DIGITS.map((digit) => (
                  <button key={digit} type="button" onClick={() => handleDigitInput(digit)}>
                    {digit}
                  </button>
                ))}
              </div>

              <div className="actions">
                <button type="button" onClick={clearSelectedCell}>
                  Clear cell
                </button>
                <button type="button" onClick={resetAll}>
                  Reset grid
                </button>
              </div>
            </div>

            <div className="panel">
              <h2>Highlight</h2>
              <div className="color-palette">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="color-swatch"
                    style={{ backgroundColor: color.value }}
                    onClick={() => setHighlight(color.value)}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="actions">
                <button type="button" onClick={() => setHighlight(null)}>
                  Remove color
                </button>
                <button type="button" onClick={clearHighlights}>
                  Clear all highlights
                </button>
              </div>
            </div>

            <div className="panel">
              <h2>Number color</h2>
              <div className="color-palette">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="color-swatch"
                    style={{ backgroundColor: color.value }}
                    onClick={() => setTextColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Import / Export</h2>
              <div className="actions">
                <label className="button-like file-input">
                  Import image
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </label>
                <button type="button" onClick={exportGrid}>
                  Export JSON
                </button>
                <label className="button-like file-input">
                  Import JSON
                  <input type="file" accept="application/json" onChange={importGrid} />
                </label>
              </div>
              <p className="helper">Includes numbers, notes, colors, and the loaded image.</p>
            </div>
          </section>
        </section>

        <section className="status">
          {selectedCell ? (
            <p>
              {selectedCells.size} cell(s) selected. Active cell: value {selectedCell.value ?? "empty"},{" "}
              {selectedCell.notes.length} note(s), background {selectedCell.highlight ?? "none"}, text color{" "}
              {selectedCell.textColor || DEFAULT_TEXT_COLOR}. Use Ctrl/Cmd + click for multi-selection.
            </p>
          ) : (
            <p>Select a cell to start. Use Ctrl/Cmd + click for multi-selection.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
