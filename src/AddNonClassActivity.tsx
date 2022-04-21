import React, { useState } from "react";
import { Firehose } from "./firehose";

/**
 * TODO: docs
 */
export function AddNonClassActivity(props: {
  firehose: Firehose;
  hidden: boolean;
}) {
  const { firehose, hidden } = props;

  // State for textbox input.
  const [nonClassName, setNonClassName] = useState("");

  return hidden ? null : (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          firehose.addNonClass(nonClassName);
          setNonClassName("");
        }}
      >
        <label htmlFor="add-non-class"></label>
        <input
          id="add-non-class"
          type="text"
          value={nonClassName}
          onChange={(e) => setNonClassName(e.target.value)}
        />
        <button type="submit">Save activity</button>
      </form>
    </div>
  );
}
