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
import { Firehose } from "./firehose";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

/** A single row in the class table. */
type ClassTableRow = {
  number: string;
  rating: string;
  hours: string;
  name: string;
  class: Class;
};

type ClassFilter = (cls: Class) => boolean;
/** Type of filter on class list; null if no filter. */
type SetClassFilter = React.Dispatch<React.SetStateAction<ClassFilter | null>>;

/**
 * Textbox for typing in the name or number of the class to search. Maintains
 * the {@link ClassFilter} that searches for a class name/number.
 */
function ClassInput(props: {
  /** All rows in the class table. */
  rowData: Array<ClassTableRow>;
  /** Callback for updating the class filter. */
  setInputFilter: SetClassFilter;
  /** Callback after pressing Enter in the textbox. */
  onEnter: () => void;
}) {
  const { rowData, setInputFilter, onEnter } = props;

  // State for textbox input.
  const [classInput, setClassInput] = useState("");

  // Fuse is a fuzzy search library; this is set-up that gets called once.
  const fuse = useMemo(() => {
    return new Fuse(rowData, {
      ignoreLocation: true,
      keys: ["name"],
      shouldSort: false,
      threshold: 0.2,
    });
  }, [rowData]);

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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onEnter();
      }}
    >
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
    </form>
  );
}

/** List of all filter IDs and their displayed names. */
const CLASS_FLAGS: Array<[keyof Flags | "fits", string]> = [
  ["hass", "HASS"],
  ["cih", "CI-H"],
  ["fits", "Fits schedule"],
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

/** Div containing all the flags like "HASS". Maintains the flag filter. */
function ClassFlags(props: {
  /** Callback for updating the class filter. */
  setFlagsFilter: SetClassFilter;
  firehose: Firehose;
  /** Callback for updating the grid filter manually. */
  updateFilter: () => void;
}) {
  const { setFlagsFilter, firehose, updateFilter } = props;

  // Map from flag to whether it's on.
  const [flags, setFlags] = useState<Map<keyof Flags | "fits", boolean>>(() => {
    const result = new Map();
    CLASS_FLAGS.forEach(([flag]) => {
      result.set(flag, false);
    });
    return result;
  });

  // this callback needs to get called when the set of classes change, because
  // the filter has to change as well
  useEffect(() => {
    firehose.fitsScheduleCallback = () => flags.get("fits") && updateFilter();
  }, [firehose, flags, updateFilter]);

  const onChange = (flag: keyof Flags | "fits", value: boolean) => {
    const newFlags = new Map(flags);
    newFlags.set(flag, value);
    setFlags(newFlags);

    // careful! we have to wrap it with a () => because otherwise react will
    // think it's an updater function instead of the actual function.
    setFlagsFilter(() => (cls: Class) => {
      let result = true;
      newFlags.forEach((value, flag) => {
        if (value && flag === "fits" && !firehose.fitsSchedule(cls)) {
          result = false;
        } else if (value && flag !== "fits" && cls.flags[flag]) {
          result = false;
        }
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
 * The table of all classes, along with searching and filtering with flags.
 *
 * TODO: test performance in build
 * TODO: style as original
 */
export function ClassTable(props: {
  classes: Map<string, Class>;
  firehose: Firehose;
}) {
  const { classes, firehose } = props;
  const gridRef = useRef<AgGridReact>(null);

  // Setup table columns
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

  // Setup rows
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

  // Need to notify grid every time we update the filter
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

  return (
    <>
      <div id="selector-div">
        <ClassInput
          rowData={rowData}
          setInputFilter={setInputFilter}
          onEnter={() =>
            firehose.toggleClass(
              gridRef?.current?.api?.getDisplayedRowAtIndex(0)?.data.class
            )
          }
        />
        <ClassFlags
          setFlagsFilter={setFlagsFilter}
          firehose={firehose}
          updateFilter={() => gridRef?.current?.api?.onFilterChanged()}
        />
      </div>
      <div className="ag-theme-alpine" style={{ height: 200 }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          suppressMovableColumns={true}
          enableCellTextSelection={true}
          isExternalFilterPresent={() => true}
          doesExternalFilterPass={doesExternalFilterPass}
          onRowClicked={(e) => firehose.setViewedActivity(e.data.class)}
          onRowDoubleClicked={(e) => firehose.toggleClass(e.data.class)}
        />
      </div>
    </>
  );
}
