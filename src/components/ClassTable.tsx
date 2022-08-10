import { AgGridReact } from "@ag-grid-community/react";
import AgGrid, { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { AddIcon, MinusIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Class, Flags } from "../lib/class";
import { classNumberMatch, classSort, simplifyString } from "../lib/utils";
import { Firehose } from "../lib/firehose";

import "@ag-grid-community/core/dist/styles/ag-grid.css";
import "@ag-grid-community/core/dist/styles/agGridAlpineFont.css";
import "./ClassTable.scss";

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
  firehose: Firehose;
}) {
  const { rowData, setInputFilter, firehose } = props;

  // State for textbox input.
  const [classInput, setClassInput] = useState("");

  // Search results for classes.
  const searchResults = useRef<
    Array<{
      numbers: Array<string>;
      name: string;
      class: Class;
    }>
  >();

  const processedRows = useMemo(
    () =>
      rowData.map((data) => {
        const numbers = [data.number];
        const [, otherNumber, realName] =
          data.name.match(/^\[(.*)\] (.*)$/) ?? [];
        if (otherNumber) numbers.push(otherNumber);
        return {
          numbers,
          name: simplifyString(realName ?? data.name),
          class: data.class,
        };
      }),
    [rowData]
  );

  const onClassInputChange = (input: string) => {
    if (input) {
      const simplifyInput = simplifyString(input);
      searchResults.current = processedRows.filter(
        (row) =>
          row.numbers.some((number) => classNumberMatch(input, number)) ||
          row.name.includes(simplifyInput)
      );
      const index = new Set(searchResults.current.map((cls) => cls.numbers[0]));
      setInputFilter(() => (cls: Class) => index.has(cls.number));
    } else {
      setInputFilter(null);
    }
    setClassInput(input);
  };

  const onEnter = () => {
    const { numbers, class: cls } = searchResults.current?.[0] ?? {};
    if (
      searchResults.current?.length === 1 ||
      numbers?.some((number) => classNumberMatch(number, classInput, true))
    ) {
      firehose.toggleActivity(cls);
      onClassInputChange("");
    }
  };

  return (
    <Flex justify="center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEnter();
        }}
      >
        <InputGroup>
          <InputLeftElement pointerEvents="none" children={<SearchIcon />} />
          <Input
            type="text"
            placeholder="Class number or name"
            _placeholder={{ opacity: 1 }}
            value={classInput}
            onChange={(e) => onClassInputChange(e.target.value)}
            width="30em"
          />
        </InputGroup>
      </form>
    </Flex>
  );
}

type FilterGroup = Array<[keyof Flags | "fits", string, string?]>;

/** List of top filter IDs and their displayed names. */
const CLASS_FLAGS_1: FilterGroup = [
  ["hass", "HASS"],
  ["cih", "CI-H"],
  ["fits", "Fits schedule"],
  ["nofinal", "No final"],
];

/** List of hidden filter IDs, their displayed names, and image path, if any. */
const CLASS_FLAGS_2: FilterGroup = [
  ["under", "Undergrad", "img/under.gif"],
  ["grad", "Graduate", "img/grad.gif"],
  ["le9units", "≤ 9 units"],
  ["half", "Half-term"],
  ["limited", "Limited enrollment"],
];

/** Second row of hidden filter IDs. */
const CLASS_FLAGS_3: FilterGroup = [
  ["rest", "REST", "img/rest.gif"],
  ["Lab", "Institute Lab", "img/Lab.gif"],
  ["hassA", "HASS-A", "img/hassA.gif"],
  ["hassH", "HASS-H", "img/hassH.gif"],
  ["hassS", "HASS-S", "img/hassS.gif"],
  ["cihw", "CI-HW"],
  ["notcih", "Not CI-H"],
];

const CLASS_FLAGS = CLASS_FLAGS_1.concat(CLASS_FLAGS_2).concat(CLASS_FLAGS_3);

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
    for (const flag of CLASS_FLAGS) {
      result.set(flag, false);
    }
    return result;
  });

  // Show hidden flags?
  const [allFlags, setAllFlags] = useState(false);

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
        } else if (value && flag !== "fits" && !cls.flags[flag]) {
          result = false;
        }
      });
      return result;
    });
  };

  const renderGroup = (group: FilterGroup) => {
    return (
      <ButtonGroup isAttached={true} colorScheme="orange">
        {group.map(([flag, label, image]) => {
          const checked = flags.get(flag);
          const content = (
            <Button
              key={flag}
              onClick={() => onChange(flag, !checked)}
              variant={checked ? "solid" : "outline"}
            >
              {image ? <Image src={image} alt={label} /> : label}
            </Button>
          );
          return image ? <Tooltip label={label}>{content}</Tooltip> : content;
        })}
      </ButtonGroup>
    );
  };

  return (
    <Flex direction="column" align="center" gap={2}>
      <Flex align="center">
        {renderGroup(CLASS_FLAGS_1)}
        <Button
          leftIcon={allFlags ? <MinusIcon /> : <AddIcon />}
          onClick={() => setAllFlags(!allFlags)}
          size="sm"
          ml={2}
        >
          {allFlags ? "Less filters" : "More filters"}
        </Button>
      </Flex>
      {allFlags && (
        <>
          {renderGroup(CLASS_FLAGS_2)}
          {renderGroup(CLASS_FLAGS_3)}
        </>
      )}
    </Flex>
  );
}

/**
 * The table of all classes, along with searching and filtering with flags.
 *
 * TODO: test performance in build
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
    const numberSortProps = {
      maxWidth: 90,
      // sort by number, N/A is infinity, tiebreak with class number
      comparator: (
        valueA: string,
        valueB: string,
        nodeA: AgGrid.RowNode,
        nodeB: AgGrid.RowNode
      ) => {
        const numberA = valueA === "N/A" ? Infinity : Number(valueA);
        const numberB = valueB === "N/A" ? Infinity : Number(valueB);
        return numberA !== numberB
          ? numberA - numberB
          : classSort(nodeA.data.number, nodeB.data.number);
      },
      ...sortProps,
    };
    return [
      {
        field: "number",
        headerName: "Class",
        comparator: classSort,
        initialSort,
        maxWidth: 100,
        ...sortProps,
      },
      { field: "rating", ...numberSortProps },
      { field: "hours", ...numberSortProps },
      { field: "name", flex: 1 },
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

  const doesExternalFilterPass = useMemo(() => {
    return (node: AgGrid.RowNode) => {
      if (inputFilter && !inputFilter(node.data.class)) return false;
      if (flagsFilter && !flagsFilter(node.data.class)) return false;
      return true;
    };
  }, [inputFilter, flagsFilter]);

  // Need to notify grid every time we update the filter
  useEffect(() => {
    gridRef.current?.api?.onFilterChanged();
  }, [doesExternalFilterPass]);

  return (
    <Flex direction="column" gap={4}>
      <ClassInput
        rowData={rowData}
        setInputFilter={setInputFilter}
        firehose={firehose}
      />
      <ClassFlags
        setFlagsFilter={setFlagsFilter}
        firehose={firehose}
        updateFilter={() => gridRef.current?.api?.onFilterChanged()}
      />
      <Box className="ag-theme-firehose">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          suppressMovableColumns={true}
          enableCellTextSelection={true}
          isExternalFilterPresent={() => true}
          doesExternalFilterPass={doesExternalFilterPass}
          onRowClicked={(e) => firehose.setViewedActivity(e.data.class)}
          onRowDoubleClicked={(e) => firehose.toggleActivity(e.data.class)}
          onGridReady={() => gridRef.current?.columnApi?.autoSizeAllColumns()}
          // these have to be set here, not in css:
          headerHeight={40}
          rowHeight={40}
        />
      </Box>
    </Flex>
  );
}
