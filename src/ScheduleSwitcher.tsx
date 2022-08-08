import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Select,
} from "@chakra-ui/react";
import { useState } from "react";

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
      <Select
        value={saveId}
        size="sm"
        onChange={(e) => {
          if (!saveId) {
            setConfirmSave(e.target.value);
          } else {
            firehose.loadSave(e.target.value);
          }
        }}
        width="fit-content"
        display="inline-block"
      >
        {!saveId && <option value="">Not saved</option>}
        {saves.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </Select>
      <Modal isOpen={Boolean(confirmSave)} onClose={() => setConfirmSave("")}>
        <ModalBody>
          The current schedule is loaded from a URL and is not saved. Are you
          sure you want to load schedule {confirmName} without saving your
          current schedule?
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmSave("")}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              firehose.loadSave(confirmSave);
              setConfirmSave("");
            }}
          >
            Load schedule
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function RenameBar(props: { firehose: Firehose; saveId: string }) {
  const { firehose, saveId } = props;
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  return !show ? (
    <Button className="btn btn-secondary btn-sm" onClick={() => setShow(true)}>
      Rename
    </Button>
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
      <Button className="btn btn-secondary btn-sm" type="submit">
        Rename
      </Button>
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
      <Button
        className="btn btn-secondary btn-sm"
        onClick={() => setShow(true)}
      >
        Delete
      </Button>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <ModalBody>Are you sure you want to delete schedule {name}?</ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              firehose.removeSave(saveId);
              setShow(false);
            }}
          >
            Delete
          </Button>
        </ModalFooter>
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
      <Button
        className="btn btn-secondary btn-sm"
        onClick={() => setShow(true)}
      >
        Share
      </Button>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <ModalHeader>
          Share schedule
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          Copy the following link: <a href={link}>{link}</a>
        </ModalBody>
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
    <Flex>
      <SelectWithWarn firehose={firehose} saveId={saveId} saves={saves} />
      {saveId && <RenameBar firehose={firehose} saveId={saveId} />}
      {saveId && (
        <DeleteModal
          firehose={firehose}
          saveId={saveId}
          name={saves.find((save) => save.id === saveId)!.name}
        />
      )}
      <Button
        className="btn btn-secondary btn-sm"
        onClick={() => firehose.addSave(Boolean(saveId))}
      >
        {saveId ? "New" : "Save"}
      </Button>
      <ExportModal firehose={firehose} />
    </Flex>
  );
}
