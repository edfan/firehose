import React, { useMemo, useRef, useState } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { ModuleRegistry, RowNode } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { DebounceInput } from "react-debounce-input";
import Fuse from "fuse.js";

import "@ag-grid-community/core/dist/styles/ag-grid.css";
import "@ag-grid-community/core/dist/styles/ag-theme-alpine.css";

import { Class } from "./class";
import { classSort, classNumberMatch } from "./utils";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type ClassTableRow = {
  class: string;
  rating: string;
  hours: string;
  name: string;
};

/**
 * TODO: add filtering by flags
 *    TODO: how will we do the "no conflicts" filter?
 * TODO: add class on enter
 * TODO: implement click events
 * TODO: test performance in build
 * TODO: style as original
 * TODO: add loading?
 */

export function ClassTable(props: { classes: Map<string, Class> }) {
  const gridRef = useRef<AgGridReact>(null);

  const columnDefs = useMemo(() => {
    const initialSort: "asc" = "asc";
    const sortingOrder: Array<"asc" | "desc"> = ["asc", "desc"];
    const sortProps = { sortable: true, unSortIcon: true, sortingOrder };
    return [
      {
        field: "class",
        comparator: classSort,
        initialSort,
        ...sortProps,
      },
      { field: "rating", ...sortProps },
      { field: "hours", ...sortProps },
      { field: "name" },
    ];
  }, []);

  const rowData = useMemo(() => {
    const rows: Array<ClassTableRow> = [];
    props.classes.forEach((cls) => {
      const { number, evals, name } = cls;
      rows.push({
        class: number,
        rating: evals.rating.slice(0, 3), // remove the "/7.0" if exists
        hours: evals.hours,
        name: name,
      });
    });
    return rows;
  }, [props.classes]);

  const [classInput, setClassInput] = useState("");

  const onClassInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClassInput(e.target.value);
    gridRef.current?.api.onFilterChanged();
  };

  const isExternalFilterPresent = useMemo(() => () => classInput !== "", [
    classInput,
  ]);

  const fuse = useMemo(() => {
    return new Fuse(rowData, {
      ignoreLocation: true,
      keys: ["name"],
      shouldSort: false,
      threshold: 0.2,
    });
  }, [rowData]);

  const doesExternalFilterPass = useMemo(() => {
    const results = fuse.search(classInput).map(({ item }) => item.class);
    return (node: RowNode) =>
      results.includes(node.data.class) ||
      classNumberMatch(classInput, node.data.class);
  }, [classInput, fuse]);

  return (
    <>
      <div id="selector-div">
        <label id="class-input-label" htmlFor="class-input">
          Class number or name:&nbsp;
        </label>
        <DebounceInput
          type="text"
          placeholder="8.01"
          id="class-input"
          value={classInput}
          onChange={onClassInputChange}
          minLength={2}
          debounceTimeout={300}
        />
      </div>
      <div className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          suppressMovableColumns={true}
          enableCellTextSelection={true}
          isExternalFilterPresent={isExternalFilterPresent}
          doesExternalFilterPass={doesExternalFilterPass}
        ></AgGridReact>
      </div>
    </>
  );
}
