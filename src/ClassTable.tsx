import { useMemo } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

import "@ag-grid-community/core/dist/styles/ag-grid.css";
import "@ag-grid-community/core/dist/styles/ag-theme-alpine.css";

import { RawClass } from "./class";
import { formatNumber, classSort } from "./utils";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type ClassTableRow = {
  class: string;
  rating: string;
  hours: string;
  name: string;
};


/**
 * TODO: add filtering by number or name
 * TODO: add filtering by flags
 *    TODO: how will we do the "no conflicts" filter?
 * TODO: add class on enter
 * TODO: implement click events
 * TODO: test performance in build
 * TODO: style as original
 * TODO: add loading?
 */

export function ClassTable(props: { rawClasses: Map<string, RawClass> }) {
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
    props.rawClasses.forEach((cls) =>
      rows.push({
        class: cls.no,
        rating: formatNumber(cls.ra, 1),
        hours: formatNumber(cls.h, 1),
        name: cls.n,
      })
    );
    return rows;
  }, [props.rawClasses]);

  return (
    <div className="ag-theme-alpine">
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        suppressMovableColumns={true}
        enableCellTextSelection={true}
      ></AgGridReact>
    </div>
  );
}
