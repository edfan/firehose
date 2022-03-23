import { Class, Flags } from "./class";

function TypeSpan(props: { flag: string; title: string }) {
  const { flag, title } = props;
  return (
    <span className="type-span" id={`${flag}-span`}>
      <img
        alt={title}
        height="16"
        width="16"
        src={`img/${flag}.gif`}
        data-toggle="tooltip"
        data-placement="top"
        title={title}
        data-trigger="hover"
    /></span>
  );
}

function LinkedClass(props: { number: string }) {
  const { number } = props;
  // @ts-ignore class_desc is some global from script.js
  return <span className="link-span" onClick={() => class_desc(number)}>{number}</span>;
}

function ClassRelated(props: { cls: Class }) {
  const { cls } = props;
  const { prereq, same, meets } = cls.related;

  const linkClasses = (str: string) =>
    str
      .split(/([ ,;[\]()])/)
      .map((text) => (text.includes(".") ? <LinkedClass number={text} /> : text));

  return <>
    <span id="class-prereq">Prereq: {linkClasses(prereq)}</span>
    {same ? <span id="class-same"><br />Same class as: {linkClasses(same)}</span> : null}
    {meets ? <span id="class-meets"><br />Meets with: {linkClasses(meets)}</span> : null}
  </>;
}

function ClassTypes(props: { cls: Class }) {
  const { cls } = props;
  const { flags, totalUnits, units } = cls;

  const makeFlags = (arr: Array<[keyof Flags, string]>) =>
    arr
      .filter(([flag, _]) => flags[flag])
      .map(([flag, title]) => <TypeSpan key={flag} flag={flag} title={title} />);

  const types1 = makeFlags([
    ["nonext", "Not offered 2021-2022"],
    ["under", "Undergrad"],
    ["grad", "Graduate"],
  ]);

  const seasons = makeFlags([
    ["fall", "Fall"],
    ["iap", "IAP"],
    ["spring", "Spring"],
    ["summer", "Summer"],
  ])
    .map((tag) => [tag, ", "])
    .flat()
    .slice(0, -1);

  const types2 = makeFlags([
    ["repeat", "Can be repeated for credit"],
    ["rest", "REST"],
    ["Lab", "Institute Lab"],
    ["PartLab", "Partial Institute Lab"],
    ["hassH", "HASS-H"],
    ["hassA", "HASS-A"],
    ["hassS", "HASS-S"],
    ["hassE", "HASS-E"],
    ["cih1", "CI-H"],
    ["cihw", "CI-HW"],
  ]);

  return (
    <p id="class-type">
      {types1} ({seasons}) {types2} {totalUnits} units: {units.join("-")}
      {flags.final ? <span className="type-span" id="final-span"> Has final</span> : null}<br />
      <ClassRelated cls={cls} />
    </p>
  );
}

function ClassEval(props: { cls: Class }) {
  const { cls } = props;
  const { rating, hours, people } = cls.evals;

  return <p id="class-eval">
    Rating: {rating}&nbsp;&nbsp;&nbsp;
    Hours: {hours}&nbsp;&nbsp;&nbsp;
    Avg # of students: {people}
  </p>;
}

function ClassBody(props: { cls: Class }) {
  const { cls } = props;
  const { description, inCharge, extraUrls } = cls.description;

  return <p id="class-desc">
    {description}<br/><br/>
    {inCharge ? <><em>In-charge: {inCharge}</em><br/><br/></> : null}
    {extraUrls
      .map<React.ReactNode>(
        ({ label, url }) => <a href={url} target="_blank">{label}</a>
      )
      .reduce((acc, cur) => [acc, " | ", cur])}
  </p>;
}

export function ClassDescription(props: { cls: Class }): React.ReactElement {
  const { cls } = props;

  return <>
    <p id="class-name">{cls.number}: {cls.name}</p>
    <div id="flags-div">
      <ClassTypes cls={cls} />
      <ClassEval cls={cls} />
    </div>
    <div id="class-buttons-div"></div>
    <p id="manual-button" style={{"display": "none"}}>+ Manually set sections</p>
    <div id="manual-div" style={{"display": "none"}}>
      <div id="man-lec-div">
        Lecture:<br />
        <input type="radio" className="man-button" id="lec-auto" name="lec" value="auto" /> Auto
        (default)<br />
        <input type="radio" className="man-button" id="lec-none" name="lec" value="none" /> None<br />
        <div id="spec-man-lec-div"></div>
      </div>
      <div id="man-rec-div">
        Recitation:<br />
        <input type="radio" className="man-button" id="rec-auto" name="rec" value="auto" /> Auto
        (default)<br />
        <input type="radio" className="man-button" id="rec-none" name="rec" value="none" /> None<br />
        <div id="spec-man-rec-div"></div>
      </div>
      <div id="man-lab-div">
        Lab:<br />
        <input type="radio" className="man-button" id="lab-auto" name="lab" value="auto" /> Auto
        (default)<br />
        <input type="radio" className="man-button" id="lab-none" name="lab" value="none" /> None<br />
        <div id="spec-man-lab-div"></div>
      </div>
    </div>
    <ClassBody cls={cls} />
  </>;
}
