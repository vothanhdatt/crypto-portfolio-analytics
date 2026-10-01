"use client";

import { useRef, useState } from "react";
import { ApiRequestError, importTrades, resetTrades } from "@/lib/api";
import type { ApiErrorDetail } from "@/types/api";
import type { PortfolioSnapshot } from "@/types/portfolio";

type ImportStatus = "idle" | "reading" | "importing" | "resetting" | "success" | "error";
const MAX_CSV_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const BLOCKING_FILE_ERROR_CODES = new Set(["INVALID_FILE_TYPE", "FILE_TOO_LARGE", "FILE_READ_FAILED"]);

const countCsvDataRows = (contents: string) => {
  let inQuotes = false;
  let recordHasContent = false;
  let records = 0;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];

    if (character === '"') {
      if (inQuotes && contents[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      recordHasContent = true;
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && contents[index + 1] === "\n") index += 1;
      if (recordHasContent) records += 1;
      recordHasContent = false;
    } else if (!/\s/.test(character)) {
      recordHasContent = true;
    }
  }

  if (recordHasContent) records += 1;
  return Math.max(0, records - 1);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ImportPanel({
  portfolio,
  onPortfolioChange,
}: {
  portfolio: PortfolioSnapshot;
  onPortfolioChange: (snapshot: PortfolioSnapshot) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ApiErrorDetail[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isBusy = status === "reading" || status === "importing" || status === "resetting";

  const clearFeedback = () => {
    setMessage("");
    setErrors([]);
  };

  const selectFile = async (nextFile?: File) => {
    clearFeedback();
    setRowCount(null);

    if (!nextFile) {
      setFile(null);
      setStatus("idle");
      return;
    }

    setFile(nextFile);
    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      setStatus("error");
      setMessage("Only CSV files can be imported.");
      setErrors([{ field: "file", code: "INVALID_FILE_TYPE", message: "Choose a file with the .csv extension." }]);
      return;
    }

    if (nextFile.size > MAX_CSV_FILE_SIZE_BYTES) {
      setStatus("error");
      setMessage("The selected CSV file is too large.");
      setErrors([
        {
          field: "file",
          code: "FILE_TOO_LARGE",
          message: "Choose a CSV file that is 4 MB or smaller.",
          value: nextFile.size,
        },
      ]);
      return;
    }

    setStatus("reading");
    try {
      const contents = await nextFile.text();
      setRowCount(countCsvDataRows(contents));
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("The selected file could not be read.");
      setErrors([{ field: "file", code: "FILE_READ_FAILED", message: "Choose the file again and retry." }]);
    }
  };

  const handleImport = async () => {
    if (!file || status === "reading") return;

    clearFeedback();
    setStatus("importing");
    try {
      const snapshot = await importTrades(file);
      onPortfolioChange(snapshot);
      setStatus("success");
      setMessage(`Imported ${snapshot.transactionCount} transactions from ${file.name}.`);
    } catch (error) {
      setStatus("error");
      if (error instanceof ApiRequestError) {
        setMessage(error.message);
        setErrors(error.details);
      } else {
        setMessage(error instanceof Error ? error.message : "The import could not be completed.");
        setErrors([]);
      }
    }
  };

  const handleReset = async () => {
    clearFeedback();
    setStatus("resetting");
    try {
      const snapshot = await resetTrades();
      onPortfolioChange(snapshot);
      setFile(null);
      setRowCount(null);
      if (inputRef.current) inputRef.current.value = "";
      setStatus("success");
      setMessage(`Sample data restored with ${snapshot.transactionCount} transactions.`);
    } catch (error) {
      setStatus("error");
      if (error instanceof ApiRequestError) {
        setMessage(error.message);
        setErrors(error.details);
      } else {
        setMessage(error instanceof Error ? error.message : "Sample data could not be restored.");
        setErrors([]);
      }
    }
  };

  return (
    <section className="panel import-panel" aria-labelledby="import-title" aria-busy={isBusy}>
      <div className="import-copy">
        <p className="eyebrow">Dataset controls</p>
        <h2 id="import-title">Import trade history</h2>
        <p>Replace the active trades only after the complete CSV passes backend validation.</p>
        <div className="dataset-status">
          <span className={`source-badge source-${portfolio.source}`}>{portfolio.source === "sample" ? "Sample data" : "Imported data"}</span>
          <strong>{portfolio.transactionCount} transactions active</strong>
        </div>
        <button className="secondary-button reset-data-button" type="button" onClick={handleReset} disabled={isBusy || portfolio.source === "sample"}>
          {status === "resetting" ? "Restoring sample…" : "Reset to sample data"}
        </button>
      </div>

      <div className="import-workspace">
        <label
          className={`file-dropzone${isDragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void selectFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={isBusy}
            onClick={(event) => { event.currentTarget.value = ""; }}
            onChange={(event) => { void selectFile(event.target.files?.[0]); }}
          />
          <span className="dropzone-icon" aria-hidden="true">⇧</span>
          <span className="dropzone-title">Drop a trades CSV here</span>
          <span className="dropzone-copy">or choose a file · CSV only · maximum 4 MB</span>
        </label>

        {file && (
          <div className="selected-file" aria-live="polite">
            <span className="file-type" aria-hidden="true">CSV</span>
            <div>
              <strong>{file.name}</strong>
              <span>{formatFileSize(file.size)} · {status === "reading" ? "Counting rows…" : `${rowCount ?? 0} data rows`}</span>
            </div>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              disabled={isBusy}
              onClick={() => {
                setFile(null);
                setRowCount(null);
                clearFeedback();
                setStatus("idle");
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              ×
            </button>
          </div>
        )}

        <button
          className="primary-button import-button"
          type="button"
          onClick={handleImport}
          disabled={
            !file || isBusy || (status === "error" && BLOCKING_FILE_ERROR_CODES.has(errors[0]?.code ?? ""))
          }
        >
          {status === "importing" ? "Validating and importing…" : "Import transactions"}
        </button>

        {message && (
          <div className={`import-message import-message-${status}`} role={status === "error" ? "alert" : "status"}>
            <span aria-hidden="true">{status === "success" ? "✓" : "!"}</span>
            <strong>{message}</strong>
            {status === "error" && <small>The current dashboard dataset has not been replaced.</small>}
          </div>
        )}

        {errors.length > 0 && (
          <div className="validation-errors" role="region" aria-live="polite" aria-labelledby="validation-errors-title">
            <div className="validation-errors-heading">
              <strong id="validation-errors-title">Validation errors</strong>
              <span>{errors.length} {errors.length === 1 ? "issue" : "issues"}</span>
            </div>
            <ol>
              {errors.map((error, index) => (
                <li key={`${error.row ?? "file"}-${error.field ?? "general"}-${error.code}-${index}`}>
                  <div className="error-location">
                    <strong>{error.row ? `Row ${error.row}` : "File"}</strong>
                    {error.field && <span>{error.field}</span>}
                    {error.tradeId && <span>{error.tradeId}</span>}
                  </div>
                  <p>{error.message}</p>
                  <code>{error.code}</code>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
