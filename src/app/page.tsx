/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useState } from "react";
import * as XLSX from "xlsx";
import CompareCCB from "./CompareceCCB";

dayjs.extend(customParseFormat);

type RowData = {
  "Número CCB": number;
  "Vlr Solicitado": number;
  "Vlr Total do Crédito": number;
  "Data de Inclusão": string;
  Status: string;
  [key: string]: any;
};

export default function Home() {
  const [month, setMonth] = useState("6");
  const [bank, setBank] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [total2, setTotal2] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContrats] = useState(0);

  const alvoCardHandleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // Lê o workbook
        const wb = XLSX.read(bstr, { type: "binary" });
        // Pega a primeira planilha
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        // Converte em JSON – cada item é uma linha
        const data: RowData[] = XLSX.utils
          .sheet_to_json(sheet, {
            raw: false, // para garantir strings inicialmente
            defval: 0, // valores vazios viram 0
          })
          // remove qualquer linha cujo Número CCB seja string vazia ou undefined
          .filter((row: any) => {
            const ccb = row["Número CCB"];
            const status = row["Status"];
            const data = row["Data de Inclusão"];

            // 1) Parse com o formato correspondente: dia/mês/ano(2 dígitos) hora:minuto
            const dt = dayjs(data, "D/M/YY HH:mm");

            // 2) Pegar o mês:
            //    - dt.month() retorna 0–11 (0 = janeiro)
            //    - dt.month() + 1 retorna 1–12
            const mesZeroBased = dt.month(); // ex: 5
            const mes1a12 = dt.month() + 1; // ex: 6

            // ou, se você quiser direto como string "6"
            const mesString = dt.format("M"); // '6'

            return (
              ccb !== 0 &&
              ccb !== undefined &&
              ccb !== null &&
              status !== "Cancelada" &&
              mesString === month
            );
          })
          .map((row: any) => ({
            ...row,
            "Vlr Solicitado": Number(row["Vlr Solicitado"]) || 0,
            "Vlr Total do Crédito": Number(row["Vlr Total do Crédito"]) || 0,
          }));

        // Calcula o somatório
        const soma = data.reduce((acc, cur) => acc + cur["Vlr Solicitado"], 0);
        const soma2 = data.reduce(
          (acc, cur) => acc + cur["Vlr Total do Crédito"],
          0
        );

        setTotal(soma);
        setTotal2(soma2);
        setError(null);
        setContrats(data.length);
      } catch (err: any) {
        console.error(err);
        setError(
          "Erro ao processar o arquivo. Verifique se é um .xlsx válido."
        );
        setTotal(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 space-y-16">
      <h2 className="text-xl font-semibold mb-2">Produção</h2>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <p>Banco:</p>

          <Select onValueChange={(event) => setBank(event)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um banco" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Banco</SelectLabel>
                <SelectItem value={"Alvo card"}>Alvo card</SelectItem>
                <SelectItem value={"Vem card"}>Vem card</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <p>Mês:</p>

          <Select
            defaultValue={String(dayjs().month() + 1)}
            onValueChange={(event) => {
              setMonth(event);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um mês" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Mês</SelectLabel>
                <SelectItem value={"1"}>Janeiro</SelectItem>
                <SelectItem value={"2"}>Fevereiro</SelectItem>
                <SelectItem value={"3"}>Março</SelectItem>
                <SelectItem value={"4"}>Abril</SelectItem>
                <SelectItem value={"5"}>Maio</SelectItem>
                <SelectItem value={"6"}>Junho</SelectItem>
                <SelectItem value={"7"}>Julho</SelectItem>
                <SelectItem value={"8"}>Agosto</SelectItem>
                <SelectItem value={"9"}>Setembro</SelectItem>
                <SelectItem value={"10"}>Outubro</SelectItem>
                <SelectItem value={"11"}>Novembro</SelectItem>
                <SelectItem value={"12"}>Dezembro</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {bank === "Alvo card" && month && (
          <div className="flex items-center gap-4">
            <p>Arquivo:</p>

            <Input
              type="file"
              accept=".xlsx, .xls"
              onChange={alvoCardHandleFile}
              className="w-fit"
            />
          </div>
        )}

        {error && <p className="text-red-600">{error}</p>}
        {total !== null && total2 !== null && (
          <div className="mt-4">
            <p className="text-green-700">
              <strong>Valor liquido</strong>: R$ {total.toLocaleString("pt-BR")}
            </p>

            <p className="text-green-700">
              <strong>Valor bruto</strong>: R$ {total2.toLocaleString("pt-BR")}
            </p>

            <p className="text-green-700">
              Número de <strong>contratos</strong>: {contracts}
            </p>
          </div>
        )}
      </div>

      <CompareCCB />
    </div>
  );
}
