/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import * as XLSX from "xlsx";

const CompareCCB: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [onlyInA, setOnlyInA] = useState<string[]>([]);
  const [onlyInB, setOnlyInB] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Extrai valores da coluna "Número CCB" de um workbook
  const getCCBNumbers = (workbook: XLSX.WorkBook): string[] => {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
    return rows
      .map((row) => String(row["Número CCB"] || "").trim())
      .filter((val) => val !== "");
  };

  // Retorna itens em A não em B
  const difference = (A: string[], B: string[]): string[] => {
    const setB = new Set(B);
    return A.filter((item) => !setB.has(item));
  };

  const compareFiles = async () => {
    if (!fileA || !fileB) {
      setError("Selecione ambos os arquivos antes de comparar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const dataA = await fileA.arrayBuffer();
      const dataB = await fileB.arrayBuffer();
      const wbA = XLSX.read(dataA, { type: "array" });
      const wbB = XLSX.read(dataB, { type: "array" });
      const ccbA = getCCBNumbers(wbA);
      const ccbB = getCCBNumbers(wbB);
      setOnlyInA(difference(ccbA, ccbB));
      setOnlyInB(difference(ccbB, ccbA));
    } catch (e) {
      console.error(e);
      setError("Erro ao ler ou processar os arquivos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <h2 className="text-xl font-semibold mb-4">
        Identificar contratos duplicados
      </h2>

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-4">
          <p>
            Arquivo 1 <span className="font-bold">(2tech)</span>:
          </p>

          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFileA(e.target.files?.[0] || null)}
            className="w-fit cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-4">
          <p>
            Arquivo 2 <span className="font-bold">(banco)</span>:
          </p>

          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFileB(e.target.files?.[0] || null)}
            className="w-fit cursor-pointer"
          />
        </div>

        <Button
          size={"lg"}
          onClick={compareFiles}
          disabled={loading}
          className="bg-blue-600 text-white cursor-pointer w-[220px] hover:bg-blue-700"
        >
          {loading ? "Processando..." : "Comparar"}
        </Button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {!error && (onlyInA.length > 0 || onlyInB.length > 0) && (
        <div className="space-y-4">
          {onlyInA.length > 0 && (
            <div>
              <h3 className="font-medium">
                Contratos presentes no 2TECH e não no BANCO:
              </h3>
              <ul className="list-disc ml-6">
                {onlyInA.map((ccb) => (
                  <li key={ccb}>
                    Número CCB: <span className="font-bold">{ccb}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* {onlyInB.length > 0 && (
            <div>
              <h3 className="font-medium">
                Contratos presentes em Arquivo 2 e não em Arquivo 1:
              </h3>
              <ul className="list-disc ml-6">
                {onlyInB.map((ccb) => (
                  <li key={ccb}>
                    Número CCB: <span className="font-bold">{ccb}</span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}
        </div>
      )}
      {!error && !loading && onlyInA.length === 0 && (
        <p className="text-green-600">
          Os dados no 2tech e no banco estão compatíveis.
        </p>
      )}
    </div>
  );
};

export default CompareCCB;
