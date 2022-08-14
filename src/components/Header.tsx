import { Flex, Image, Select } from "@chakra-ui/react";

import { Term } from "../lib/dates";
import { Firehose } from "../lib/firehose";

/** Given a urlName like i22, return its corresponding URL. */
function toUrl(urlName: string, latestUrlName: string): string {
  if (urlName === latestUrlName) {
    return "index.html";
  }
  const { semesterFull } = new Term({ urlName });
  return `semesters/${urlName}/${semesterFull}.html`;
}

/** Given a urlName like "i22", return the previous one, "f21". */
function getLastUrlName(urlName: string): string {
  const { semester, year } = new Term({ urlName });
  if (semester === "f") {
    return `s${year}`;
  } else if (semester === "s") {
    return `i${year}`;
  } else {
    return `f${parseInt(year, 10) - 1}`;
  }
}

/** urlNames that don't have a Firehose */
const EXCLUDED_URLS = ["i21", "i20"];

/** Earliest urlName we have a Firehose for. */
const EARLIEST_URL = "f17";

/** Return all urlNames before the given one. */
function getUrlNames(latestTerm: string): Array<string> {
  let urlName = latestTerm;
  const res = [];
  while (urlName !== EARLIEST_URL) {
    res.push(urlName);
    do {
      urlName = getLastUrlName(urlName);
    } while (EXCLUDED_URLS.includes(urlName));
  }
  res.push(EARLIEST_URL);
  return res;
}

/** Header above the left column, with logo and semester selection. */
export function Header(props: { firehose: Firehose }) {
  const { firehose } = props;
  const defaultValue = toUrl(firehose.term.urlName, firehose.latestTerm);

  return (
    <Flex align="end">
      <Image src="img/logo.png" alt="Firehose logo" h="40px" />
      <Select
        size="sm"
        w="fit-content"
        defaultValue={defaultValue}
        onChange={(e) => {
          const elt = e.target;
          window.location.href = elt.options[elt.selectedIndex].value;
        }}
      >
        {getUrlNames(firehose.latestTerm).map((urlName) => {
          const { niceName } = new Term({ urlName });
          return (
            <option key={urlName} value={toUrl(urlName, firehose.latestTerm)}>
              {niceName}
            </option>
          );
        })}
      </Select>
    </Flex>
  );
}
