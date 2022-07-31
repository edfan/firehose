import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

import { Firehose, Save } from "./firehose";

function SelectWithWarn(props: {
  firehose: Firehose;
  saveId: string;
  saves: Array<Save>;
}) {
  const { firehose, saveId, saves } = props;
  const [confirmSave, setConfirmSave] = useState("");
  const confirmName = saves.find((save) => save.id === confirmSave)?.name;
  return (
    <>
      <Form.Select
        value={saveId}
        size="sm"
        onChange={(e) => {
          if (!saveId) {
            setConfirmSave(e.target.value);
          } else {
            firehose.loadSave(e.target.value);
          }
        }}
      >
        {!saveId && <option value="">Not saved</option>}
        {saves.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </Form.Select>
      <Modal
        show={Boolean(confirmSave)}
        onHide={() => setConfirmSave("")}
        animation={false}
      >
        <Modal.Body>
          The current schedule is loaded from a URL and is not saved. Are you
          sure you want to load schedule {confirmName} without saving your
          current schedule?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmSave("")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              firehose.loadSave(confirmSave);
              setConfirmSave("");
            }}
          >
            Load schedule
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function RenameBar(props: { firehose: Firehose; saveId: string }) {
  const { firehose, saveId } = props;
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  return !show ? (
    <button className="btn btn-secondary btn-sm" onClick={() => setShow(true)}>
      Rename
    </button>
  ) : (
    <form
      className="non-class-form"
      onSubmit={(e) => {
        e.preventDefault();
        firehose.renameSave(saveId, name);
        setName("");
        setShow(false);
      }}
    >
      <label>New name: </label>{" "}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn btn-secondary btn-sm" type="submit">
        Rename
      </button>
    </form>
  );
}

function DeleteModal(props: {
  firehose: Firehose;
  saveId: string;
  name: string;
}) {
  const { firehose, saveId, name } = props;
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setShow(true)}
      >
        Delete
      </button>
      <Modal show={show} onHide={() => setShow(false)} animation={false}>
        <Modal.Body>
          Are you sure you want to delete schedule {name}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              firehose.removeSave(saveId);
              setShow(false);
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function ExportModal(props: { firehose: Firehose }) {
  const { firehose } = props;
  const [show, setShow] = useState(false);
  const link = firehose.urlify();

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setShow(true)}
      >
        Share
      </button>
      <Modal show={show} onHide={() => setShow(false)} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Share schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Copy the following link: <a href={link}>{link}</a>
        </Modal.Body>
      </Modal>
    </>
  );
}

export function ScheduleSwitcher(props: {
  firehose: Firehose;
  saveId: string;
  saves: Array<Save>;
}) {
  const { firehose, saveId, saves } = props;
  return (
    <div id="schedule-switcher-div">
      <SelectWithWarn firehose={firehose} saveId={saveId} saves={saves} />
      {saveId && <RenameBar firehose={firehose} saveId={saveId} />}
      {saveId && (
        <DeleteModal
          firehose={firehose}
          saveId={saveId}
          name={saves.find((save) => save.id === saveId)!.name}
        />
      )}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => firehose.addSave(Boolean(saveId))}
      >
        {saveId ? "New" : "Save"}
      </button>
      <ExportModal firehose={firehose} />
    </div>
  );
}
