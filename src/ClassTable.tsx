import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import AgGrid, { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { DebounceInput } from "react-debounce-input";
import Fuse from "fuse.js";

import "@ag-grid-community/core/dist/styles/ag-grid.css";
import "@ag-grid-community/core/dist/styles/ag-theme-alpine.css";

import { Class, Flags } from "./class";
import { classSort, classNumberMatch } from "./utils";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type ClassTableRow = {
  number: string;
  rating: string;
  hours: string;
  name: string;
  class: Class;
};

type ClassFilter = (cls: Class) => boolean;
type SetClassFilter = React.Dispatch<React.SetStateAction<ClassFilter | null>>;

function ClassInput(props: {
  rowData: Array<ClassTableRow>;
  setInputFilter: SetClassFilter;
}) {
  const { rowData, setInputFilter } = props;

  const fuse = useMemo(() => {
    return new Fuse(rowData, {
      ignoreLocation: true,
      keys: ["name"],
      shouldSort: false,
      threshold: 0.2,
    });
  }, [rowData]);

  const [classInput, setClassInput] = useState("");

  const onClassInputChange = (input: string) => {
    if (input) {
      const results = fuse.search(input).map(({ item }) => item.number);
      // careful! we have to wrap it with a () => because otherwise react will
      // think it's an updater function instead of the actual function.
      setInputFilter(() => (cls: Class) =>
        results.includes(cls.number) || classNumberMatch(input, cls.number)
      );
    } else {
      setInputFilter(null);
    }
    setClassInput(input);
  };

  return (
    <>
      <label id="class-input-label" htmlFor="class-input">
        Class number or name:&nbsp;
      </label>
      {/* TODO: is debounce here necessary? */}
      <DebounceInput
        type="text"
        placeholder="8.01"
        id="class-input"
        value={classInput}
        onChange={(e) => onClassInputChange(e.target.value)}
        debounceTimeout={300}
      />
    </>
  );
}

const CLASS_FLAGS: Array<[keyof Flags, string]> = [
  ["hass", "HASS"],
  ["cih", "CI-H"],
  ["nofinal", "No final"],
  ["hassA", "HASS-A"],
  ["hassH", "HASS-H"],
  ["hassS", "HASS-S"],
  ["cihw", "CI-HW"],
  ["notcih", "Not CI-H"],
  ["rest", "REST"],
  ["Lab", "Institute Lab"],
  ["under", "Undergrad"],
  ["grad", "Graduate"],
  ["le9units", "≤ 9 units"],
];

function ClassFlags(props: { setFlagsFilter: SetClassFilter }) {
  const { setFlagsFilter } = props;

  const [flags, setFlags] = useState<Map<keyof Flags, boolean>>(() => {
    const result = new Map();
    CLASS_FLAGS.forEach(([flag]) => {
      result.set(flag, false);
    });
    return result;
  });

  const onChange = (flag: keyof Flags, value: boolean) => {
    const newFlags = new Map(flags);
    newFlags.set(flag, value);
    setFlags(newFlags);
    // careful! we have to wrap it with a () => because otherwise react will
    // think it's an updater function instead of the actual function.
    setFlagsFilter(() => (cls: Class) => {
      let result = true;
      // either button is off (!value) or class has flag (cls.flags[flag])
      newFlags.forEach((value, flag) => {
        result &&= !value || cls.flags[flag];
      });
      return result;
    });
  };

  return (
    <div className="btn-group">
      {CLASS_FLAGS.map(([flag, label]) => (
        <label className="btn btn-primary" key={flag}>
          <input
            type="checkbox"
            checked={flags.get(flag)}
            onChange={(e) => onChange(flag, e.target.checked)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

/**
 * TODO: no conflicts filter
 * TODO: add class on enter
 * TODO: implement click events
 * TODO: test performance in build
 * TODO: style as original
 * TODO: add loading?
 * TODO: document
 */

export function ClassTable(props: {
  classes: Map<string, Class>;
  setCurrentClass: (cls: Class) => void;
}) {
  const { classes, setCurrentClass } = props;
  const gridRef = useRef<AgGridReact>(null);

  const columnDefs = useMemo(() => {
    const initialSort: "asc" = "asc";
    const sortingOrder: Array<"asc" | "desc"> = ["asc", "desc"];
    const sortProps = { sortable: true, unSortIcon: true, sortingOrder };
    return [
      {
        field: "number",
        headerName: "Class",
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
    classes.forEach((cls) => {
      const { number, evals, name } = cls;
      rows.push({
        number: number,
        rating: evals.rating.slice(0, 3), // remove the "/7.0" if exists
        hours: evals.hours,
        name: name,
        class: cls,
      });
    });
    return rows;
  }, [classes]);

  const [inputFilter, setInputFilter] = useState<ClassFilter | null>(null);
  const [flagsFilter, setFlagsFilter] = useState<ClassFilter | null>(null);

  useEffect(() => {
    gridRef.current?.api?.onFilterChanged();
  }, [inputFilter, flagsFilter]);

  const doesExternalFilterPass = useMemo(() => {
    return (node: AgGrid.RowNode) => {
      if (inputFilter && !inputFilter(node.data.class)) return false;
      if (flagsFilter && !flagsFilter(node.data.class)) return false;
      return true;
    };
  }, [inputFilter, flagsFilter]);

  const onRowClicked = (e: AgGrid.RowClickedEvent) => {
    setCurrentClass(e.node.data.class);
  };

  return (
    <>
      <div id="selector-div">
        <ClassInput rowData={rowData} setInputFilter={setInputFilter} />
        <ClassFlags setFlagsFilter={setFlagsFilter} />
      </div>
      <div className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          suppressMovableColumns={true}
          enableCellTextSelection={true}
          isExternalFilterPresent={() => true}
          doesExternalFilterPass={doesExternalFilterPass}
          onRowClicked={onRowClicked}
        ></AgGridReact>
      </div>
    </>
  );
}
