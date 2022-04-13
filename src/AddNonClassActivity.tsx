import { Firehose } from "./firehose";

/**
 * TODO: write
 * TODO: docs
 */
export function AddNonClassActivity(props: {
  firehose: Firehose;
  hidden: boolean;
}) {
  const { firehose, hidden } = props;

  return hidden ? null : <div>TODO</div>;
}
